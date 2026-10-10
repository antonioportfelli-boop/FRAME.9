import { useState } from "react";
import { capabilityMatrix, probeHardware, requestUsbDevice, type HardwareProfile } from "@/lib/signal/hardware";
import { rdapObsFrame, usbDeviceFrame } from "@/lib/signal/frames";
import { useDesk } from "@/lib/signal/store";
import { capLabel } from "./capLabel";
import { Row } from "./Row";

export function HostPane() {
  const hw = useDesk((s) => s.hardware);
  const rows = capabilityMatrix(hw);
  const [usbError, setUsbError] = useState<string | null>(null);
  const [usbBusy, setUsbBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [gps, setGps] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? rows : rows.filter((row) => row.state === "READY" || row.state === "USER_CONSENT_REQUIRED" || row.state === "PERMISSION_REQUIRED" || row.state === "NOT_CONNECTED");
  const hidden = rows.length - visible.length;
  const link = !hw?.connection.supported
    ? "link puudu"
    : `${hw.connection.effectiveType ?? "tüüp puudu"} · ${hw.connection.rtt ?? "rtt puudu"} ms`;

  return (
    <div>
      <div className="border-b border-line px-3 py-3">
        <p className="font-mono text-[10px] tracking-[0.18em] text-brass">SEE HOST</p>
        <p className="mt-2 font-mono text-xs text-fg">
          {hw ? `${hw.klass} · ${hw.secure ? "turvaline" : hw.secure === false ? "ebaturvaline" : "turvalisus teadmata"} · ${hw.online ? "võrgus" : "võrguta"}` : "loen"}
        </p>
        <p className="mt-1 font-mono text-xs text-muted">
          {hw ? `${link} · ${hw.probedAt ? new Date(hw.probedAt).toLocaleTimeString() : "mõõda uuesti"}` : "mõõtmist veel ei ole"}
        </p>
        <button
          type="button"
          className="mt-3 h-11 w-full border border-teal text-xs text-teal"
          onClick={() => {
            void probeHardware().then((next) => useDesk.getState().setHardware(next));
          }}
        >
          Mõõda uuesti
        </button>
      </div>
      {hw ? <Profile hw={hw} /> : <p className="px-3 py-2 text-sm text-muted">Loen seadet…</p>}
      <div className="border-b border-line p-3">
        <button
          type="button"
          className="h-11 w-full border border-line text-sm text-fg"
          onClick={() => {
            if (!navigator.geolocation) {
              setGps("Sellel seadmel ei ole asukoha liidest.");
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const lat = pos.coords.latitude.toFixed(5);
                const lon = pos.coords.longitude.toFixed(5);
                setGps(`${lat}, ${lon} · ±${Math.round(pos.coords.accuracy)} m`);
              },
              () => setGps("Asukohta ei antud."),
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
            );
          }}
        >
          See seade
        </button>
        <p className="mt-2 text-xs text-muted">Ainult see seade, kui ise loa annad. Telefoninumbrit ei otsita. Koordinaate ei salvestata.</p>
        {gps ? <p className="mt-2 font-mono text-xs text-teal">{gps}</p> : null}
      </div>
      <div className="flex items-center justify-between gap-3 border-y border-line bg-ink px-3 py-2">
        <h3 className="font-mono text-xs text-teal">{showAll ? "Kõik read" : "Mis vastab"}</h3>
        <button type="button" className="h-11 border border-line px-3 font-mono text-xs text-muted" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Peida puuduvad" : `Puuduvad ${hidden}`}
        </button>
      </div>
      <ul>
        {visible.map((row) => (
          <li key={row.id} className="border-b border-line px-3 py-2">
            <p className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs text-fg">{row.label}</span>
              <span className={`font-mono text-xs ${row.state === "READY" ? "text-teal" : "text-brass"}`}>{capLabel(row.state)}</span>
            </p>
            <p className="mt-1 text-xs text-pretty text-muted">{row.detail}</p>
          </li>
        ))}
      </ul>
      <div className="border-b border-line p-3">
        <button
          type="button"
          disabled={usbBusy}
          className="h-11 w-full border border-teal text-sm text-teal disabled:border-line disabled:text-muted"
          onClick={() => {
            setUsbBusy(true);
            setUsbError(null);
            requestUsbDevice()
              .then((device) => {
                const desk = useDesk.getState();
                const rel = (performance.now() - desk.sessionStart) / 1000;
                desk.pushFrame(usbDeviceFrame(rel, device));
              })
              .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : "USB request failed";
                if (!/cancel|no device/i.test(message)) setUsbError(message);
              })
              .finally(() => setUsbBusy(false));
          }}
        >
          {usbBusy ? "Waiting…" : "Authorize USB device"}
        </button>
        {usbError ? <p className="mt-2 text-sm text-brass">{usbError}</p> : null}
        <p className="mt-2 text-xs text-pretty text-muted">A connected id is not an RF or DVB tuner. No driver is loaded.</p>
      </div>
      <form
        className="p-3"
        onSubmit={(event) => {
          event.preventDefault();
          const q = query.trim();
          if (!q || lookupBusy) return;
          setLookupBusy(true);
          setLookup(null);
          fetch(`/api/rdap?q=${encodeURIComponent(q)}`)
            .then(async (response) => {
              const body = (await response.json()) as {
                error?: string;
                record?: Record<string, string | null>;
                notOwner?: string;
                query?: string;
              };
              if (!response.ok || body.error) {
                setLookup(body.error ?? "Lookup failed.");
                return;
              }
              const record = body.record ?? {};
              const summary = [record.name, record.handle, record.country].filter(Boolean).join(" · ") || "No name in the trimmed record";
              setLookup(`${summary}. ${body.notOwner ?? "Not a device owner."}`);
              const desk = useDesk.getState();
              const rel = (performance.now() - desk.sessionStart) / 1000;
              desk.pushFrame(rdapObsFrame(rel, body.query ?? q, summary));
            })
            .catch(() => setLookup("Lookup failed."))
            .finally(() => setLookupBusy(false));
        }}
      >
        <label className="text-xs text-muted" htmlFor="rdap-query">
          Registry lookup
        </label>
        <input
          id="rdap-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="IP, domain, or ASN"
          className="mt-2 h-11 w-full border border-line bg-ink px-3 font-mono text-xs text-fg outline-none placeholder:text-muted"
        />
        <button type="submit" disabled={lookupBusy} className="mt-2 h-11 w-full border border-line text-sm text-fg disabled:text-muted">
          {lookupBusy ? "Looking up…" : "Look up"}
        </button>
        {lookup ? <p className="mt-2 text-sm text-pretty text-muted">{lookup}</p> : null}
      </form>
    </div>
  );
}

function Profile({ hw }: { hw: HardwareProfile }) {
  const memory = hw.memoryGb == null ? "avaldamata" : `~${hw.memoryGb} GB ämber`;
  const model = [hw.model, hw.architecture, hw.bitness].filter(Boolean).join(" · ") || "avaldamata";
  return (
    <dl>
      <Row k="Klass" v={hw.klass} />
      <Row k="Tuumad" v={String(hw.cores)} />
      <Row k="Mälu" v={memory} />
      <Row k="Platvorm" v={hw.platform} />
      <Row k="Mudel" v={model} />
      <Row k="GPU" v={hw.gpu ?? "avaldamata"} />
      <Row k="Ekraan" v={`${hw.screen.w}×${hw.screen.h} @${hw.screen.dpr.toFixed(2)}`} />
      <Row k="Puude" v={String(hw.touchPoints)} />
      <Row k="Aku" v={hw.battery ? `${Math.round(hw.battery.level * 100)}% ${hw.battery.charging ? "laeb" : "ei lae"}` : "avaldamata"} />
      <Row k="Vöönd" v={hw.timeZone || "avaldamata"} />
      <Row k="Seadmed" v={hw.mediaUnlabeled ? "nimed peidus" : "nimed näha"} />
    </dl>
  );
}
