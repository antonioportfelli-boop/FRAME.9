import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { gaiaDr3Sample } from "@/lib/cosmic/gaia-dr3-snapshot";

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
  const normalizedQuery = query.trim().toLowerCase();
  const entities = useMemo(() => gaiaDr3Sample.entities.filter((entity) =>
    !normalizedQuery || `${entity.id} ${entity.name}`.toLowerCase().includes(normalizedQuery),
  ), [normalizedQuery]);
  const selected = entities.find((entity) => entity.id === selectedId) ?? entities[0];
  const activeId = selected?.id ?? null;

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
          <span>{entities.length} / {gaiaDr3Sample.entities.length} sources · bounded sample</span>
        </div>
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
          Data: ESA/Gaia/DPAC, Gaia DR3. Positions are shown at the catalogue reference epoch; no distance or source class is inferred.
        </p>
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
