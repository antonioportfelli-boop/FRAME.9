import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bluetooth,
  Cpu,
  Crosshair,
  FileCode,
  Flame,
  Hexagon,
  Layers,
  List,
  Radio,
  Search,
  SlidersHorizontal,
  Snowflake,
  Tv,
  Shield,
  Image,
  Wrench,
  Activity,
  Cable,
  Mail,
  Scale,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { ForceGraph } from "@/components/graph/ForceGraph";
import { InstallBanner } from "@/components/desk/InstallBanner";
import { ShaderField, type ShaderMode } from "@/components/desk/ShaderField";
import { MirrorLayer } from "@/components/desk/MirrorDesk";
import { useAccount } from "@/lib/signal/account";
import { useMemory } from "@/lib/signal/memory";
import { useMirrors } from "@/lib/signal/mirrors";
import { ModuleBody } from "@/components/modules/Panes";
import { hostInventoryFrame, hostLinkFrame, makeBench, nextBenchFrame } from "@/lib/signal/frames";
import { probeHardware, readLink, type HardwareProfile } from "@/lib/signal/hardware";
import { accuracyRows } from "@/lib/signal/accuracy";
import { installBlock } from "@/lib/signal/block";
import { usePlates } from "@/lib/signal/plates";
import { persistDesk, useDesk, type SessionPreset } from "@/lib/signal/store";
import { getWorld } from "@/lib/graph/world";
import { nodeMatches, type ModuleId } from "@/lib/signal/types";

const ICONS: Record<ModuleId, LucideIcon> = {
  frames: List,
  decode: Layers,
  hex: Hexagon,
  host: Cpu,
  wifi: Wifi,
  bluetooth: Bluetooth,
  radio: Radio,
  television: Tv,
  node: Crosshair,
  block: Shield,
  plates: Image,
  kit: Wrench,
  audit: Activity,
  wire: Cable,
  market: Scale,
  post: Mail,
  lookup: Search,
  source: FileCode,
};

function inventoryLines(hw: HardwareProfile): { label: string; value: string }[] {
  return [
    { label: "class", value: hw.klass },
    { label: "cores", value: String(hw.cores) },
    { label: "memory", value: hw.memoryGb == null ? "unpublished" : `~${hw.memoryGb} GB bucket` },
    { label: "platform", value: hw.platform },
    { label: "model", value: hw.model ?? "unpublished" },
    { label: "gpu", value: hw.gpu ?? "unpublished" },
    { label: "screen", value: `${hw.screen.w}×${hw.screen.h} · dpr ${hw.screen.dpr}` },
    { label: "bluetooth", value: hw.bluetooth },
    { label: "online", value: String(hw.online) },
    { label: "secure", value: hw.secure ? "yes" : "no" },
    { label: "zone", value: hw.timeZone },
    { label: "devices", value: hw.mediaUnlabeled ? "counts only, labels hidden" : "labels visible" },
    { label: "note", value: "Browser host APIs. Not an Android system inventory." },
  ];
}

function exportSession() {
  const desk = useDesk.getState();
  const world = getWorld();
  const body = {
    product: "FRAME.9",
    mode: desk.demo ? "SYNTHETIC_DEMO" : "LIVE",
    exportedAt: new Date().toISOString(),
    session: desk.session,
    warning: "Synthetic raw bytes are omitted. Structured rows are not a packet capture.",
    accuracy: accuracyRows(desk.hardware, desk.demo),
    observations: desk.frames.map((frame) => ({
      no: frame.no,
      rel: frame.rel,
      proto: frame.proto,
      info: frame.info,
      source: frame.source,
      origin: frame.origin,
      domain: frame.domain,
      src: frame.src,
      dst: frame.dst,
      byteLength: frame.source === "SYNTHETIC_DEMO" || !frame.bytes ? null : frame.bytes.length,
    })),
    entities: world.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      kind: node.kind,
      domain: node.domain,
    })),
    edges: world.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relationship: edge.label,
    })),
  };
  const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = desk.demo ? "session-demo.json" : "session.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function Desk() {
  const windows = useDesk((s) => s.windows);
  const search = useDesk((s) => s.search);
  const setSearch = useDesk((s) => s.setSearch);
  const frozen = useDesk((s) => s.frozen);
  const pps = useDesk((s) => s.metrics.pps);
  const fieldOpen = useDesk((s) => s.fieldOpen);
  const graph = useDesk((s) => s.graph);
  const filter = useDesk((s) => s.filter);
  const hexWidth = useDesk((s) => s.hexWidth);
  useDesk((s) => s.graphEpoch); // Re-render when the external graph changes.
  const demo = useDesk((s) => s.demo);
  const session = useDesk((s) => s.session);
  const obsCount = useDesk((s) => s.frames.length);
  const searchRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(0);
  const [shader, setShader] = useState<ShaderMode>(0);
  const plate = usePlates((s) => s.src);

  const matches = (() => {
    const nodes = getWorld().nodes;
    const q = search.trim();
    if (!q) return nodes.length;
    return nodes.filter((node) => nodeMatches(node, q)).length;
  })();

  const elapsed = session ? Math.max(0, Math.floor((now - session.startedAt) / 1000)) : 0;

  useEffect(() => {
    useDesk.getState().hydrate();
    installBlock();
    let cancel = false;
    void probeHardware().then((hw) => {
      if (!cancel) useDesk.getState().setHardware(hw);
    });
    const bench = makeBench(performance.now());
    let benchTimer = 0;
    let inventoried: number | null = null;
    let lastLinkFrame = 0;

    const sampleLink = () => {
      const link = readLink();
      const desk = useDesk.getState();
      desk.patchLink({
        online: link.online,
        downlink: link.downlink,
        rtt: link.rtt,
        effectiveType: link.effectiveType,
        linkType: link.type,
        saveData: link.saveData,
        history: true,
      });
      setNow(performance.now());
      let live = useDesk.getState();
      if (live.session && (document.hidden || (live.session.until != null && performance.now() >= live.session.until))) {
        live.stopSession();
        live = useDesk.getState();
      }
      if (!live.session || live.demo || !live.capture) return;
      if (inventoried !== live.session.startedAt && live.hardware) {
        inventoried = live.session.startedAt;
        live.pushFrame(hostInventoryFrame(0, inventoryLines(live.hardware)));
      }
      const stamp = performance.now();
      if (stamp - lastLinkFrame < 2000) return;
      lastLinkFrame = stamp;
      const rel = (stamp - live.session.startedAt) / 1000;
      live.pushFrame(
        hostLinkFrame(rel, {
          online: link.online,
          effectiveType: link.effectiveType,
          type: link.type,
          downlink: link.downlink,
          rtt: link.rtt,
          saveData: link.saveData,
          klass: live.hardware?.klass ?? "desktop",
        }),
      );
    };

    const pumpBench = () => {
      const desk = useDesk.getState();
      if (desk.demo && desk.capture && !document.hidden) {
        desk.pushFrame(nextBenchFrame(bench, performance.now()));
      }
      const rate = desk.demo ? (desk.hardware?.benchPps ?? 8) : 2;
      benchTimer = window.setTimeout(pumpBench, 1000 / rate);
    };

    sampleLink();
    const hostTimer = window.setInterval(sampleLink, 1000);
    pumpBench();
    const onHide = () => {
      if (document.hidden) useDesk.getState().stopSession();
    };
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("keydown", onKey);
    const reprobe = () => {
      void probeHardware().then((next) => {
        if (!cancel) useDesk.getState().setHardware(next);
      });
    };
    window.addEventListener("gamepadconnected", reprobe);
    window.addEventListener("gamepaddisconnected", reprobe);
    window.addEventListener("online", reprobe);
    window.addEventListener("offline", reprobe);
    const usb = (navigator as Navigator & { usb?: { addEventListener?: (type: string, fn: () => void) => void; removeEventListener?: (type: string, fn: () => void) => void } }).usb;
    usb?.addEventListener?.("connect", reprobe);
    usb?.addEventListener?.("disconnect", reprobe);
    return () => {
      cancel = true;
      window.clearTimeout(benchTimer);
      window.clearInterval(hostTimer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("gamepadconnected", reprobe);
      window.removeEventListener("gamepaddisconnected", reprobe);
      window.removeEventListener("online", reprobe);
      window.removeEventListener("offline", reprobe);
      usb?.removeEventListener?.("connect", reprobe);
      usb?.removeEventListener?.("disconnect", reprobe);
    };
  }, []);

  const booted = useRef(false);
  useEffect(() => {
    if (!booted.current) {
      booted.current = true;
      return;
    }
    persistDesk();
  }, [windows, graph, filter, hexWidth]);

  const open = windows.filter((win) => win.open);
  const solo = open.find((win) => !win.minimized) ?? null;
  const hardware = useDesk((s) => s.hardware);
  const account = useAccount((s) => s.session);
  const [more, setMore] = useState(false);
  const phone = hardware?.klass === "phone" || (typeof window !== "undefined" && window.innerWidth < 800);
  const dock = phone && !more ? windows.filter((win) => ["host", "audit", "lookup", "block", "wire"].includes(win.id)) : windows;
  useEffect(() => {
    document.documentElement.dataset.phone = phone ? "1" : "0";
    if (hardware) useMemory.getState().remember(hardware);
  }, [hardware, phone]);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-bg text-fg">
      <header className="safe-top z-50 shrink-0 border-b border-line bg-bg">
        <div className="flex items-center gap-2 overflow-hidden px-3 py-2">
          <div className="min-w-0">
            <p className="font-mono text-lg text-teal">FRAME.9</p>
            <p className="hidden truncate text-xs text-muted sm:block">Signal desk</p>
          </div>
          <button type="button" className="ml-auto h-11 shrink-0 border border-line px-3 font-mono text-xs text-teal" onClick={() => useDesk.getState().openModule("source")}>
            SOURCE / REMIX
          </button>
          <button
            type="button"
            className={`h-11 shrink-0 border px-3 font-mono text-xs ${account?.role === "admin" ? "border-brass text-brass" : "border-line text-muted"}`}
            onClick={() => useAccount.getState().setOpen(true)}
          >
            {account ? (account.role === "admin" ? "Admin" : "Member") : "Account"}
          </button>
          <p className={`font-mono text-xs tabular-nums ${frozen ? "text-brass" : "text-teal"}`} title={frozen ? "Field frozen" : "Observations in the last second"}>
            {frozen ? "Frozen" : `${pps}/s`}
          </p>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center border border-line text-fg" aria-label="Reheat field" onClick={() => useDesk.getState().reheat()}>
            <Flame className="size-4" />
          </button>
          <button
            type="button"
            className={`inline-flex h-11 w-11 items-center justify-center border ${frozen ? "border-brass text-brass" : "border-line text-fg"}`}
            aria-label={frozen ? "Unfreeze field" : "Freeze field"}
            aria-pressed={frozen}
            onClick={() => useDesk.getState().setFrozen(!frozen)}
          >
            <Snowflake className="size-4" />
          </button>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center border border-line text-fg" aria-label="Fit fabric" onClick={() => useDesk.getState().fit()}>
            <Crosshair className="size-4" />
          </button>
          <button
            type="button"
            className={`inline-flex h-11 w-11 items-center justify-center border ${fieldOpen ? "border-teal text-teal" : "border-line text-fg"}`}
            aria-label="Field controls"
            aria-pressed={fieldOpen}
            onClick={() => useDesk.getState().setFieldOpen(!fieldOpen)}
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 pb-2">
          {(["PULSE", "SURVEY", "WATCH"] as SessionPreset[]).map((preset) => {
            const on = session?.preset === preset && !demo;
            return (
              <button
                key={preset}
                type="button"
                className={`h-11 shrink-0 border px-3 font-mono text-xs ${on ? "border-teal text-teal" : "border-line text-muted"}`}
                onClick={() => useDesk.getState().startSession(preset)}
              >
                {preset}
              </button>
            );
          })}
          <button type="button" className="h-11 shrink-0 border border-line px-3 font-mono text-xs text-fg" onClick={() => useDesk.getState().stopSession()}>
            Stop
          </button>
          <button
            type="button"
            className={`h-11 shrink-0 border px-3 font-mono text-xs ${demo ? "border-brass text-brass" : "border-line text-muted"}`}
            aria-pressed={demo}
            onClick={() => useDesk.getState().setDemo(!demo)}
          >
            {demo ? "Demo on" : "Demo"}
          </button>
          <span className="flex h-11 shrink-0 items-center font-mono text-xs tabular-nums text-muted">
            {session && !demo ? `${elapsed}s · ${session.preset}` : "idle"} · {obsCount}
          </span>
          <button type="button" className="h-11 shrink-0 border border-line px-3 font-mono text-xs text-fg" onClick={() => exportSession()}>
            Export
          </button>
          <button type="button" className="h-11 shrink-0 border border-line px-3 font-mono text-xs text-muted" onClick={() => useDesk.getState().wipeObservations()}>
            Delete
          </button>
        </div>
        {demo ? (
          <p className="border-t border-brass bg-ink px-3 py-2 font-mono text-xs text-brass">SYNTHETIC DEMO — not a live capture</p>
        ) : null}
        <form
          className="px-3 pb-2"
          onSubmit={(event) => {
            event.preventDefault();
            useDesk.getState().focusMatches();
          }}
        >
          <label className="flex h-11 items-center gap-2 border border-line bg-ink px-3">
            <Search className="size-4 shrink-0 text-muted" />
            <span className="sr-only">Search nodes</span>
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a node, kind, or domain"
              className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
            />
            <span className="font-mono text-xs tabular-nums text-muted">{matches}</span>
          </label>
        </form>
        <InstallBanner phone={phone} />
        {fieldOpen ? (
          <div className="grid gap-3 border-t border-line px-3 py-3 sm:grid-cols-3">
            <label className="text-xs text-muted">
              Repulsion {graph.charge}
              <input
                type="range"
                min={60}
                max={260}
                value={graph.charge}
                onChange={(event) => useDesk.getState().setGraph({ charge: Number(event.target.value) })}
                className="mt-2 w-full accent-teal"
              />
            </label>
            <label className="text-xs text-muted">
              Link {graph.link}
              <input
                type="range"
                min={70}
                max={220}
                value={graph.link}
                onChange={(event) => useDesk.getState().setGraph({ link: Number(event.target.value) })}
                className="mt-2 w-full accent-teal"
              />
            </label>
            <div className="flex gap-2">
              <button type="button" className="h-11 flex-1 border border-line text-sm text-fg" onClick={() => useDesk.getState().setGraph({ labels: !graph.labels })}>
                {graph.labels ? "Labels on" : "Labels off"}
              </button>
              <button type="button" className="h-11 flex-1 border border-line text-sm text-muted" onClick={() => useDesk.getState().resetLayout()}>
                Reset
              </button>
            </div>
            <div className="flex gap-2 sm:col-span-3">
              {([
                [0, "Trace"],
                [1, "Meters"],
                [2, "Warp"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`h-11 flex-1 border font-mono text-xs ${shader === id ? "border-teal text-teal" : "border-line text-muted"}`}
                  aria-pressed={shader === id}
                  onClick={() => setShader(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 sm:col-span-3">
              {([
                [6, "Relief"],
                [7, "SDF"],
                [8, "Polar"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`h-11 flex-1 border font-mono text-xs ${shader === id ? "border-teal text-teal" : "border-line text-muted"}`}
                  aria-pressed={shader === id}
                  onClick={() => setShader(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 sm:col-span-3">
              {([
                [9, "March"],
                [10, "Shade"],
                [11, "Repeat"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`h-11 flex-1 border font-mono text-xs ${shader === id ? "border-teal text-teal" : "border-line text-muted"}`}
                  aria-pressed={shader === id}
                  onClick={() => setShader(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 sm:col-span-3">
              {([
                [3, "Displace"],
                [4, "Points"],
                [5, "Ribbon"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`h-11 flex-1 border font-mono text-xs ${shader === id ? "border-teal text-teal" : "border-line text-muted"}`}
                  aria-pressed={shader === id}
                  onClick={() => setShader(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative min-h-0 flex-1">
        {!solo && !phone ? (
          <div className="pointer-events-none absolute inset-0 opacity-[0.45]">
            <ShaderField mode={shader} plate={plate} />
          </div>
        ) : null}
        {!solo ? <ForceGraph /> : null}
        {solo ? (
          <section className="absolute inset-0 flex flex-col bg-bg" aria-label={solo.title}>
            <ModuleBody id={solo.id} active />
          </section>
        ) : (
          <MirrorLayer />
        )}
      </main>

      <nav className="safe-dock z-50 flex shrink-0 gap-1 overflow-x-auto border-t border-line bg-bg px-2" aria-label="Modules">
        <a href="/trinity" className="flex h-14 min-w-16 shrink-0 flex-col items-center justify-center gap-1 text-teal" aria-label="Open Trinity workspace"><Activity className="size-4" /><span className="font-mono text-xs">Trinity</span></a>
        <button
          type="button"
          className="flex h-14 min-w-14 shrink-0 flex-col items-center justify-center gap-1 text-muted"
          onClick={() => useMirrors.getState().toggleAtlas()}
        >
          <span className="font-mono text-xs text-teal">3³</span>
          <span className="font-mono text-xs">Cube</span>
        </button>
        {dock.map((win) => {
          const Icon = ICONS[win.id];
          const on = win.open && !win.minimized;
          return (
            <button
              key={win.id}
              type="button"
              className={`flex h-14 min-w-14 shrink-0 flex-col items-center justify-center gap-1 ${on ? "text-teal" : "text-muted"}`}
              aria-pressed={on}
              aria-label={win.title}
              onClick={() => useDesk.getState().toggleModule(win.id)}
            >
              <Icon className={phone ? "size-7" : "size-4"} />
              <span className={phone ? "text-sm leading-none" : "font-mono text-xs"}>{win.title === "Bluetooth" ? "BLE" : win.title === "Television" ? "TV" : win.title}</span>
            </button>
          );
        })}
        {phone ? (
          <button type="button" className="flex h-14 min-w-14 shrink-0 flex-col items-center justify-center gap-1 text-muted" onClick={() => setMore((value) => !value)}>
            <span className="font-mono text-xs text-teal">{more ? "−" : "+"}</span>
            <span className="font-mono text-xs">{more ? "Vähem" : "Veel"}</span>
          </button>
        ) : null}
      </nav>
    </div>
  );
}
