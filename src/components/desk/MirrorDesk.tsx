import { useCallback, useEffect, useRef, useState } from "react";
import { ADMIN_EMAIL, useAccount } from "@/lib/signal/account";
import { capabilityMatrix, readMotionSample, requestBleDevice, requestUsbDevice, type HardwareProfile } from "@/lib/signal/hardware";
import { useMemory } from "@/lib/signal/memory";
import { MIRRORS, mirrorSpec, useMirrors, type MirrorId, type MirrorSpec, type MirrorWin } from "@/lib/signal/mirrors";
import { useDesk } from "@/lib/signal/store";
import { getWorld } from "@/lib/graph/world";

function Gauge({ value, max, label }: { value: number | null; max: number; label: string }) {
  const shown = value == null ? 0 : Math.max(0, Math.min(1, value / max));
  const angle = -120 + shown * 240;
  return (
    <svg viewBox="0 0 120 78" className="mx-auto h-24 w-40" aria-label={label}>
      <path d="M12 68 A48 48 0 0 1 108 68" fill="none" stroke="#2a363c" strokeWidth="4" />
      <path d="M12 68 A48 48 0 0 1 108 68" fill="none" stroke="#3d9a8c" strokeWidth="4" strokeDasharray={`${shown * 150} 150`} />
      <line x1="60" y1="68" x2="60" y2="28" stroke="#e7e2d4" strokeWidth="1.5" transform={`rotate(${angle} 60 68)`} />
      <circle cx="60" cy="68" r="2.5" fill="#b89a6a" />
      <text x="60" y="76" textAnchor="middle" fill="#8b9691" fontSize="7" fontFamily="IBM Plex Mono, monospace">
        {value == null ? "unpublished" : String(value)}
      </text>
    </svg>
  );
}

function rowsFor(spec: MirrorSpec, hw: HardwareProfile | null, hits: number, nodes: number): { k: string; v: string }[] {
  const unpublished = "unpublished";
  if (spec.domain === "host") {
    return [
      { k: "class", v: hw?.klass ?? "reading" },
      { k: "cores", v: hw ? String(hw.cores) : "reading" },
      { k: "memory", v: hw?.memoryGb == null ? unpublished : `~${hw.memoryGb} GB` },
      { k: "pointer", v: hw?.pointer ?? unpublished },
      { k: "touch", v: hw ? String(hw.touchPoints) : unpublished },
      { k: "gpu", v: hw?.gpu ?? unpublished },
      { k: "screen", v: hw ? `${hw.screen.w}×${hw.screen.h}` : unpublished },
      { k: "battery", v: hw?.battery ? `${Math.round(hw.battery.level * 100)}%` : "no cell published" },
      { k: "storage", v: hw?.storage ? `${hw.storage.usageMb} / ${hw.storage.quotaMb} MB` : unpublished },
    ];
  }
  if (spec.domain === "ether") {
    return [
      { k: "online", v: hw ? String(hw.online) : "reading" },
      { k: "link", v: hw?.connection.effectiveType ?? hw?.connection.type ?? unpublished },
      { k: "downlink", v: hw?.connection.downlink == null ? unpublished : `${hw.connection.downlink} Mb/s` },
      { k: "rtt", v: hw?.connection.rtt == null ? unpublished : `${hw.connection.rtt} ms` },
      { k: "bluetooth", v: hw?.bluetooth ?? "reading" },
      { k: "usb", v: hw ? (hw.buses.usb ? "api present" : "no WebUSB") : "reading" },
      { k: "wifi scan", v: "unsupported in a page" },
      { k: "hidden rf", v: "not observable" },
    ];
  }
  const desk = useDesk.getState();
  return [
    { k: "rate", v: `${desk.metrics.pps}/s` },
    { k: "frozen", v: desk.frozen ? "yes" : "no" },
    { k: "session", v: desk.session?.preset ?? "idle" },
    { k: "observations", v: String(desk.frames.length) },
    { k: "nodes", v: String(nodes) },
    { k: "search hits", v: String(hits) },
  ];
}

function MirrorBody({ spec }: { spec: MirrorSpec }) {
  const hw = useDesk((s) => s.hardware);
  const search = useDesk((s) => s.search);
  const pps = useDesk((s) => s.metrics.pps);
  const frozen = useDesk((s) => s.frozen);
  const session = useAccount((s) => s.session);
  const hosts = useMemory((s) => s.hosts);
  const note = useMemory((s) => s.note);
  const admin = session?.role === "admin";
  const nodes = getWorld().nodes.length;
  const hits = search.trim()
    ? getWorld().nodes.filter((node) => `${node.label} ${node.kind} ${node.domain}`.toLowerCase().includes(search.trim().toLowerCase())).length
    : nodes;
  const [motion, setMotion] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [consent, setConsent] = useState<"motion" | "ble" | "usb" | null>(null);
  const hostReport = useMemory((s) => s.hostReport);
  const rows = rowsFor(spec, hw, hits, nodes);

  if (spec.layer === "admin" && !admin) {
    return (
      <div className="flex h-full flex-col justify-center gap-3 px-4 py-6">
        <p className="font-mono text-xs text-brass">Admin is locked</p>
        <p className="text-sm text-fg">See kiht avaneb ainult kasutajale {ADMIN_EMAIL}, kui ta on sisse loginud. Teine konto jääb liikmeks.</p>
        <button type="button" className="h-11 border border-line text-sm text-fg" onClick={() => useAccount.getState().setOpen(true)}>
          Account
        </button>
      </div>
    );
  }

  const analogue =
    spec.layer === "analogue"
      ? spec.domain === "host"
        ? spec.skill === "trace"
          ? { value: hw?.battery ? Math.round(hw.battery.level * 100) : null, max: 100, label: "battery" }
          : spec.skill === "mirror"
            ? { value: hw?.touchPoints ?? null, max: 10, label: "touch" }
            : { value: hw?.cores ?? null, max: 16, label: "cores" }
        : spec.domain === "ether"
          ? spec.skill === "trace"
            ? { value: hw?.connection.downlink ?? null, max: 100, label: "downlink" }
            : { value: hw?.connection.rtt ?? null, max: 400, label: "rtt" }
          : { value: pps, max: 20, label: "rate" }
      : null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-3 py-3">
        <p className="text-sm text-fg">{spec.power}</p>
        <p className="mt-1 text-xs text-muted">{spec.usage}</p>
      </div>
      {analogue ? <Gauge value={analogue.value} max={analogue.max} label={analogue.label} /> : null}
      {spec.layer === "analogue" && spec.domain === "ether" && spec.skill === "mirror" ? (
        <p className="px-3 py-2 font-mono text-xs text-muted">
          link {hw?.online ? "up" : "down"} · bluetooth {hw?.bluetooth ?? "reading"}
        </p>
      ) : null}
      {spec.layer === "analogue" && spec.domain === "fabric" && spec.skill === "trace" ? (
        <p className="px-3 py-2 font-mono text-xs text-brass">{frozen ? "frozen" : "moving"}</p>
      ) : null}
      <dl className="min-h-0 flex-1 overflow-auto">
        {rows.map((row) => (
          <div key={row.k} className="grid grid-cols-2 gap-3 border-b border-line px-3 py-2">
            <dt className="text-xs text-muted">{row.k}</dt>
            <dd className="truncate text-right font-mono text-xs text-fg" title={row.v}>{row.v}</dd>
          </div>
        ))}
        {spec.id === "admin.host.meter" && hw
          ? (["usb", "hid", "serial", "midi", "gamepad"] as const).map((bus) => (
              <div key={bus} className="grid grid-cols-2 gap-3 border-b border-line px-3 py-2">
                <dt className="text-xs text-muted">{bus}</dt>
                <dd className="text-right font-mono text-xs text-fg">
                  {bus === "gamepad" ? `${hw.buses.gamepads} connected` : hw.buses[bus] ? "present" : "absent"}
                </dd>
              </div>
            ))
          : null}
        {spec.id === "admin.host.mirror"
          ? hosts.map((host) => (
              <div key={host.at} className="border-b border-line px-3 py-2 font-mono text-xs text-muted">
                {host.klass} · {host.cores} cores · {host.screen} · {host.platform}
              </div>
            ))
          : null}
        {spec.id === "admin.ether.mirror"
          ? capabilityMatrix(hw)
              .filter((row) => ["link", "wifi-scan", "ble-scan", "ble-pick", "hidden-rf", "rf", "dvb", "audio"].includes(row.id))
              .map((row) => (
                <div key={row.id} className="border-b border-line px-3 py-2">
                  <p className="font-mono text-xs text-teal">{row.label}</p>
                  <p className="text-xs text-muted">{row.state}. {row.detail}</p>
                </div>
              ))
          : null}
      </dl>
      {spec.id === "admin.host.trace" ? (
        <div className="border-t border-line p-3">
          <p className="mb-2 text-xs text-muted">FRAME.9 küsib luba. See ei ole Microsofti aken. Andur loetakse ainult siis, kui see siin masinas on.</p>
          {consent === "motion" ? (
            <button type="button" className="mb-2 h-11 w-full border border-teal text-sm text-teal" onClick={() => { setConsent(null); setMotion("Loen…"); void readMotionSample().then(setMotion); }}>
              Kinnita ja loe
            </button>
          ) : (
            <button type="button" className="h-11 w-full border border-line text-sm text-fg" onClick={() => setConsent("motion")}>
              Arm motion
            </button>
          )}
          {motion ? <p className="mt-2 font-mono text-xs text-muted">{motion}</p> : null}
          {hostReport ? <pre className="mt-3 max-h-40 overflow-auto font-mono text-xs text-muted">{hostReport}</pre> : null}
        </div>
      ) : null}
      {spec.id === "admin.ether.trace" ? (
        <div className="flex flex-wrap gap-2 border-t border-line p-3">
          <p className="basis-full text-xs text-muted">Valik avaneb brauseri enda aknas. Peidetud võrke ega võõrast liiklust see ei loe.</p>
          <button type="button" className="h-11 flex-1 border border-line text-xs text-fg" onClick={() => setConsent("ble")}>
            Pick Bluetooth
          </button>
          <button type="button" className="h-11 flex-1 border border-line text-xs text-fg" onClick={() => setConsent("usb")}>
            Pick USB
          </button>
          {consent === "ble" || consent === "usb" ? (
            <button
              type="button"
              className="h-11 basis-full border border-teal text-xs text-teal"
              onClick={() => {
                const which = consent;
                setConsent(null);
                if (which === "ble") {
                  void requestBleDevice()
                    .then((device) => setPick(`${device.name}${device.battery == null ? "" : ` · ${device.battery}%`}`))
                    .catch((error: unknown) => setPick(error instanceof Error ? error.message : "Bluetooth pick cancelled."));
                } else {
                  void requestUsbDevice()
                    .then((device) => setPick(device.productName ?? `USB ${device.vendorId.toString(16)}:${device.productId.toString(16)}`))
                    .catch((error: unknown) => setPick(error instanceof Error ? error.message : "USB pick cancelled."));
                }
              }}
            >
              Kinnita {consent}
            </button>
          ) : null}
          {pick ? <p className="basis-full font-mono text-xs text-muted">{pick}</p> : null}
        </div>
      ) : null}
      {spec.id === "admin.fabric.trace" ? (
        <label className="block border-t border-line p-3 text-xs text-muted">
          Local note
          <textarea
            value={note}
            onChange={(event) => useMemory.getState().setNote(event.target.value)}
            className="mt-2 h-20 w-full resize-none border border-line bg-ink p-2 text-sm text-fg outline-none"
          />
        </label>
      ) : null}
      {spec.id === "admin.fabric.meter" ? (
        <p className="border-t border-line px-3 py-2 font-mono text-xs text-teal">{session?.username} · {session?.role}</p>
      ) : null}
    </div>
  );
}

function MirrorWindow({ win }: { win: MirrorWin }) {
  const spec = mirrorSpec(win.id);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const grow = useRef<{ x: number; y: number; ow: number; oh: number } | null>(null);
  return (
    <section
      className="absolute flex flex-col overflow-hidden border border-line bg-surface text-fg"
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: 30 + (win.z % 20),
        backgroundImage: `linear-gradient(rgba(8,11,14,0.82), rgba(8,11,14,0.92)), url(${spec.art})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      role="dialog"
      aria-label={spec.title}
    >
      <header
        className="flex h-11 shrink-0 cursor-grab items-center border-b border-line bg-ink/80"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          useMirrors.getState().open(win.id);
          drag.current = { x: event.clientX, y: event.clientY, ox: win.x, oy: win.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          useMirrors.getState().move(win.id, drag.current.ox + event.clientX - drag.current.x, drag.current.oy + event.clientY - drag.current.y);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <h2 className="min-w-0 flex-1 truncate px-3 font-mono text-xs text-fg">{spec.title}</h2>
        <button type="button" className="h-11 px-3 text-xs text-muted" aria-label={`Close ${spec.title}`} onClick={() => useMirrors.getState().close(win.id)}>
          Close
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">
        <MirrorBody spec={spec} />
      </div>
      <div
        className="absolute right-0 bottom-0 h-11 w-11 cursor-se-resize"
        onPointerDown={(event) => {
          event.stopPropagation();
          grow.current = { x: event.clientX, y: event.clientY, ow: win.w, oh: win.h };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!grow.current) return;
          useMirrors.getState().resize(win.id, grow.current.ow + event.clientX - grow.current.x, grow.current.oh + event.clientY - grow.current.y);
        }}
        onPointerUp={() => {
          grow.current = null;
        }}
      />
    </section>
  );
}

const permissionNames = ["geolocation", "notifications", "camera", "microphone", "persistent-storage", "midi"] as const;

function RightsPanel() {
  const [rows, setRows] = useState<{ name: string; state: string }[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const names = permissionNames;

  const refresh = useCallback(async () => {
    const next: { name: string; state: string }[] = [];
    for (const name of names) {
      try {
        const status = await navigator.permissions.query({ name: name as PermissionName });
        next.push({ name, state: status.state });
      } catch {
        next.push({ name, state: "unsupported" });
      }
    }
    setRows(next);
  }, [names]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function ask(name: (typeof names)[number]) {
    setNote(null);
    try {
      if (name === "notifications" && "Notification" in window) {
        setNote(await Notification.requestPermission());
      } else if (name === "geolocation" && navigator.geolocation) {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(),
            () => reject(new Error("Keeldutud või asukoht puudu. Koordinaate ei salvestata.")),
            { maximumAge: 60_000, timeout: 8000 },
          );
        });
        setNote("Asukohaluba on antud. Koordinaate ei salvestata.");
      } else if ((name === "camera" || name === "microphone") && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia(name === "camera" ? { video: true } : { audio: true });
        for (const track of stream.getTracks()) track.stop();
        setNote("Voog avati ja suleti. Salvestist ei jää.");
      } else if (name === "persistent-storage" && navigator.storage?.persist) {
        setNote((await navigator.storage.persist()) ? "Püsiv salvestus on antud." : "Püsivast salvestusest keelduti.");
      } else if (name === "midi" && "requestMIDIAccess" in navigator) {
        await (navigator as Navigator & { requestMIDIAccess: () => Promise<unknown> }).requestMIDIAccess();
        setNote("MIDI-luba on antud. Porte ei loeta.");
      } else {
        setNote("Seda luba see brauser ei paku.");
      }
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Luba ei antud.");
    }
    await refresh();
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="font-mono text-xs text-teal">Õigused</p>
      <p className="mt-1 text-xs text-muted">Iga rida on selle brauseri päris olek. Puuduvat luba ei märgita antuks.</p>
      <ul className="mt-2">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-2 border-b border-line py-1">
            <span className="flex-1 font-mono text-xs text-fg">{row.name}</span>
            <span className="font-mono text-xs text-muted">{row.state}</span>
            <button type="button" className="h-8 border border-line px-2 text-xs text-fg" onClick={() => void ask(row.name as (typeof names)[number])}>
              Küsi
            </button>
          </li>
        ))}
      </ul>
      {note ? <p className="mt-2 text-xs text-brass">{note}</p> : null}
    </div>
  );
}

export function AccountWindow() {
  const open = useAccount((s) => s.open);
  const session = useAccount((s) => s.session);
  const error = useAccount((s) => s.error);
  const pending = useAccount((s) => s.pending);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  if (!open) return null;
  return (
    <section className="absolute top-24 right-3 z-50 max-h-[80vh] w-[min(100%-1.5rem,22rem)] overflow-auto border border-line bg-surface p-3 text-fg" role="dialog" aria-label="Konto">
      <div className="mb-3 flex items-center">
        <h2 className="font-mono text-xs text-teal">Konto</h2>
        <button type="button" className="ml-auto h-11 px-3 text-xs text-muted" onClick={() => useAccount.getState().setOpen(false)}>
          Sulge
        </button>
      </div>
      {session ? (
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs text-fg">{session.username}</p>
          <p className="text-xs text-muted">{session.role === "admin" ? "Admin. Kuubi adminkiht on lahti." : "Liige. Admin jääb lukku."}</p>
          <button type="button" className="h-11 border border-line text-sm" onClick={() => useAccount.getState().signOut()}>
            Välju
          </button>
          {session.role === "admin" ? <RightsPanel /> : null}
        </div>
      ) : pending ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">Kirja saatvat serverit ei ole ühendatud, seega koodi näidatakse siin. {pending.email}</p>
          <p className="font-mono text-sm text-teal">{pending.code}</p>
          <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Kinnituskood" className="h-11 border border-line bg-ink px-3 text-sm outline-none" />
          {error ? <p className="text-xs text-brass">{error}</p> : null}
          <button type="button" className="h-11 border border-teal text-sm text-teal" onClick={() => void useAccount.getState().confirmCode(code)}>
            Kinnita
          </button>
        </div>
      ) : (
        <form className="flex flex-col gap-2" onSubmit={(event) => event.preventDefault()}>
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="Kasutajanimi" className="h-11 border border-line bg-ink px-3 text-sm outline-none" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="E-post" className="h-11 border border-line bg-ink px-3 text-sm outline-none" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Parool" className="h-11 border border-line bg-ink px-3 text-sm outline-none" />
          {error ? <p className="text-xs text-brass">{error}</p> : null}
          <div className="flex gap-2">
            <button type="button" className="h-11 flex-1 border border-teal text-sm text-teal" onClick={() => void useAccount.getState().signIn(username, password)}>
              Sisene
            </button>
            <button type="button" className="h-11 flex-1 border border-line text-sm" onClick={() => void useAccount.getState().signUp(username, email, password)}>
              Loo konto
            </button>
          </div>
        </form>
      )}
      <div className="mt-3 border-t border-line pt-3">
        <a className="font-mono text-xs text-teal" href="/frame9-local.zip" download>
          Laadi kohalik programm
        </a>
        <a className="mt-2 block font-mono text-xs text-teal" href="/frame9-portable.zip" download>
          Laadi kaasa võetav
        </a>
        <p className="mt-2 text-xs text-muted">Mälupulgale. Node on kaasas. Windowsis Start-Frame9.cmd. Telefonis see ei käivitu.</p>
        <a className="mt-2 block font-mono text-xs text-muted" href="/frame9-host.zip" download>
          Laadi hostiriist
        </a>
        <p className="mt-2 text-xs text-muted">Hostiriist küsib Windowsis päris õigusi ja kirjutab aruande. Leht ei teeskle Microsofti.</p>
        <label className="mt-2 block text-xs text-muted">
          Impordi aruanne
          <input
            type="file"
            accept="application/json,.json"
            className="mt-2 block w-full text-xs"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void file.text().then((text) => {
                JSON.parse(text);
                useMemory.getState().setHostReport(text);
              }).catch(() => {
                useMemory.getState().setHostReport("Fail ei olnud JSON.");
              });
            }}
          />
        </label>
      </div>
    </section>
  );
}

export function AtlasWindow() {
  const atlas = useMirrors((s) => s.atlas);
  if (!atlas) return null;
  return (
    <section className="absolute top-28 left-3 z-40 max-h-[70vh] w-[min(100%-1.5rem,420px)] overflow-auto border border-line bg-surface" role="dialog" aria-label="3×3×3">
      <header className="sticky top-0 flex h-11 items-center border-b border-line bg-ink px-3">
        <h2 className="font-mono text-xs text-fg">3×3×3</h2>
        <button type="button" className="ml-auto h-11 px-3 text-xs text-muted" onClick={() => useMirrors.getState().toggleAtlas()}>
          Close
        </button>
      </header>
      {(["observe", "analogue", "admin"] as const).map((layer) => (
        <div key={layer} className="border-b border-line p-3">
          <p className="mb-2 font-mono text-xs text-teal">{layer}</p>
          <div className="grid grid-cols-3 gap-2">
            {MIRRORS.filter((spec) => spec.layer === layer).map((spec) => (
              <button
                key={spec.id}
                type="button"
                className="h-14 border border-line px-1 text-left font-mono text-xs text-muted hover:text-fg"
                onClick={() => useMirrors.getState().open(spec.id as MirrorId)}
              >
                {spec.domain}
                <span className="block text-fg">{spec.skill}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export function MirrorLayer() {
  const windows = useMirrors((s) => s.windows);
  useEffect(() => {
    useAccount.getState().hydrate();
    useMemory.getState().hydrate();
  }, []);
  return (
    <>
      {windows.filter((win) => win.open).map((win) => (
        <MirrorWindow key={win.id} win={win} />
      ))}
      <AtlasWindow />
      <AccountWindow />
    </>
  );
}
