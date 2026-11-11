import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { gaiaDr3Sample, gaiaDr3SampleManifest } from "@/lib/cosmic/gaia-dr3-snapshot";
import type { GaiaRefreshManifest } from "@/lib/cosmic/gaia-dr3-refresh-types";
import { validateCosmicGraphSnapshot, type CosmicGraphSnapshot } from "@/lib/cosmic/contracts";

function project(ra: number, dec: number, width: number, height: number) {
  const pad = { x: 28, y: 24 };
  return {
    x: pad.x + (ra / 360) * (width - pad.x * 2),
    y: pad.y + ((90 - dec) / 180) * (height - pad.y * 2),
  };
}

export function GaiaSnapshotGraph({ query = "" }: { query?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<CosmicGraphSnapshot>(gaiaDr3Sample);
  const [manifest, setManifest] = useState<GaiaRefreshManifest | typeof gaiaDr3SampleManifest>(gaiaDr3SampleManifest);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const entities = useMemo(() => snapshot.entities.filter((entity) =>
    !normalizedQuery || `${entity.id} ${entity.name}`.toLowerCase().includes(normalizedQuery),
  ), [normalizedQuery, snapshot]);
  const selected = entities.find((entity) => entity.id === selectedId) ?? entities[0];
  const activeId = selected?.id ?? null;

  async function checkArchive() {
    setRefreshing(true);
    setRefreshError(null);
    setRefreshNotice(null);
    try {
      const response = await fetch("/api/cosmic/gaia", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
        cache: "no-store",
      });
      const body = await response.json() as {
        snapshot?: unknown;
        manifest?: GaiaRefreshManifest;
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(body.error?.message ?? "Gaia Archive check failed.");
      if (!body.manifest) throw new Error("Gaia Archive returned incomplete provenance metadata.");
      const validated = validateCosmicGraphSnapshot(body.snapshot);
      if (!validated.ok) throw new Error("Gaia Archive snapshot failed local graph validation.");
      setSnapshot(validated.value);
      setManifest(body.manifest);
      setRefreshNotice(body.manifest.cache === "SERVER_CACHE"
        ? "Using the validated server cache."
        : "A new Gaia DR3 response was validated and cached.");
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Gaia Archive check failed; the current snapshot remains available.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#0c1116";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#28373b";
      ctx.lineWidth = 1;
      for (let ra = 0; ra <= 360; ra += 45) {
        const x = project(ra, 0, width, height).x;
        ctx.beginPath();
        ctx.moveTo(x, 18);
        ctx.lineTo(x, height - 18);
        ctx.stroke();
      }
      for (let dec = -60; dec <= 60; dec += 30) {
        const y = project(0, dec, width, height).y;
        ctx.beginPath();
        ctx.moveTo(18, y);
        ctx.lineTo(width - 18, y);
        ctx.stroke();
      }
      for (const entity of entities) {
        if (!entity.position) continue;
        const point = project(entity.position.longitudeDeg, entity.position.latitudeDeg, width, height);
        const active = entity.id === activeId;
        ctx.beginPath();
        ctx.arc(point.x, point.y, active ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = active ? "#d1ad70" : "#53b8a4";
        ctx.globalAlpha = active ? 1 : 0.78;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#91a09c";
      ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText("RA 0°", 20, height - 8);
      ctx.textAlign = "right";
      ctx.fillText("RA 360°", width - 20, height - 8);
      ctx.textAlign = "left";
      ctx.fillText("DEC +90°", 20, 15);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [activeId, entities]);

  function selectNearest(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    let nearest: { id: string; distance: number } | null = null;
    for (const entity of entities) {
      if (!entity.position) continue;
      const point = project(entity.position.longitudeDeg, entity.position.latitudeDeg, rect.width, rect.height);
      const distance = Math.hypot(point.x - (event.clientX - rect.left), point.y - (event.clientY - rect.top));
      if (distance < 14 && (!nearest || distance < nearest.distance)) nearest = { id: entity.id, distance };
    }
    if (nearest) setSelectedId(nearest.id);
  }

  return (
    <section className="absolute inset-0 flex flex-col bg-bg" aria-label="Gaia DR3 sky sample">
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-muted">
          <span>Gaia DR3 · ICRS · reference epoch 2016.0 TCB</span>
          <span>{entities.length} / {snapshot.entities.length} sources · bounded sample</span>
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="min-h-10 border border-teal px-3 font-mono text-xs text-teal disabled:opacity-50"
            onClick={() => void checkArchive()}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            {refreshing ? "CHECKING GAIA ARCHIVE…" : "CHECK GAIA ARCHIVE"}
          </button>
          <span className="font-mono text-[10px] text-muted">
            {"cache" in manifest && manifest.cache === "SERVER_CACHE" ? "SERVER CACHE" :
              "cache" in manifest && manifest.cache === "ESA_TAP" ? "ESA TAP" : "COMMITTED SNAPSHOT"} · {manifest.retrievedAt}
          </span>
        </div>
        {refreshError ? <p role="alert" className="mb-2 border border-brass bg-ink px-3 py-2 text-xs text-brass">{refreshError} The current validated snapshot remains in view.</p> : null}
        {refreshNotice ? <p role="status" className="mb-2 text-xs text-teal">{refreshNotice}</p> : null}
        <canvas
          ref={canvasRef}
          className="min-h-0 w-full flex-1 border border-line"
          role="img"
          aria-label="Equirectangular sky plot of the bounded Gaia DR3 sample; right ascension runs left to right and declination top to bottom"
          onClick={selectNearest}
        />
        <div className="mt-2 grid gap-2 border border-line bg-ink p-3 text-xs sm:grid-cols-3">
          <span className="font-mono text-teal">{selected?.name ?? "No source selected"}</span>
          <span className="text-muted">RA {selected?.position?.longitudeDeg.toFixed(5) ?? "—"}° · Dec {selected?.position?.latitudeDeg.toFixed(5) ?? "—"}°</span>
          <span className="text-muted">Parallax {selected?.astrometry?.parallaxMas?.toFixed(4) ?? "—"} mas · source measurement</span>
        </div>
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">
          Data: ESA/Gaia/DPAC, Gaia DR3. Positions stay at the catalogue reference epoch; no distance, source class, or motion propagation is inferred. Archive checks are user-triggered and cached for up to 24 hours per server process.
        </p>
        <details className="mt-2 border-t border-line pt-2 text-[10px] text-muted">
          <summary className="cursor-pointer font-mono">Source and retrieval record</summary>
          <div className="mt-2 grid gap-1 break-words">
            <span>{manifest.dataset} · {manifest.table} · {manifest.rowCount} rows</span>
            <span>Retrieved {manifest.retrievedAt} · TAP job {manifest.jobId}</span>
            <span>SHA-256 {manifest.sha256}</span>
            {"cacheValidUntil" in manifest ? <span>Server cache expires {manifest.cacheValidUntil}</span> : null}
            <code className="break-all whitespace-normal">{manifest.query}</code>
            <span>{manifest.attribution}</span>
          </div>
        </details>
        <details className="mt-2 border-t border-line pt-2 text-xs text-muted">
          <summary className="cursor-pointer">Browse the {entities.length} visible source IDs</summary>
          <ul className="mt-2 grid max-h-28 grid-cols-2 gap-1 overflow-auto sm:grid-cols-4">
            {entities.map((entity) => (
              <li key={entity.id}>
                <button type="button" className="font-mono hover:text-teal" onClick={() => setSelectedId(entity.id)}>
                  {entity.id.replace("gaia-dr3:", "")}
                </button>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
