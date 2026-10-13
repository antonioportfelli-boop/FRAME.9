import { create } from "zustand";
import { noteObservation, showDemoWorld, showLiveWorld } from "@/lib/graph/world";
import { MODULES, type Field, type Frame, type FrameDraft, type ModuleId } from "@/lib/signal/types";
import type { HardwareProfile } from "@/lib/signal/hardware";

export type SessionPreset = "PULSE" | "SURVEY" | "WATCH";

export type ScanSession = {
  preset: SessionPreset;
  startedAt: number;
  until: number | null;
};

export type Win = {
  id: ModuleId;
  title: string;
  open: boolean;
  minimized: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
};

export type GraphParams = {
  charge: number;
  link: number;
  labels: boolean;
};

export type Metrics = {
  pps: number;
  ppsWindow: number[];
  downlink: number | null;
  rtt: number | null;
  effectiveType: string | null;
  linkType: string | null;
  online: boolean;
  saveData: boolean;
  linkHistory: { down: number | null; rtt: number | null }[];
  radio: { peakHz: number; rms: number } | null;
  raster: { luma: number; chroma: number; motion: number; mode: string } | null;
  bleName: string | null;
  bleBattery: number | null;
  bleError: string | null;
};

const emptyMetrics = (): Metrics => ({
  pps: 0,
  ppsWindow: [],
  downlink: null,
  rtt: null,
  effectiveType: null,
  linkType: null,
  online: true,
  saveData: false,
  linkHistory: [],
  radio: null,
  raster: null,
  bleName: null,
  bleBattery: null,
  bleError: null,
});

export function defaultWindows(vw: number, vh: number): Win[] {
  const narrow = vw < 800;
  const top = narrow ? 252 : 244;
  if (narrow) {
    const w = Math.max(200, vw - 16);
    const y = 168;
    const h = Math.max(280, vh - y - 76);
    return MODULES.map((mod, index) => ({
      id: mod.id,
      title: mod.title,
      open: false,
      minimized: false,
      x: 8,
      y,
      w,
      h,
      z: index + 1,
    }));
  }
  const place: Record<ModuleId, Pick<Win, "x" | "y" | "w" | "h" | "open">> = {
    frames: { x: 16, y: Math.max(top, vh - 72 - 248), w: 400, h: 236, open: true },
    host: { x: Math.max(16, vw - 348), y: top, w: 328, h: 280, open: false },
    wifi: { x: Math.max(16, vw - 348), y: top + 16, w: 328, h: 260, open: false },
    decode: { x: 16, y: top, w: 380, h: 300, open: false },
    hex: { x: 24, y: top + 24, w: 420, h: 280, open: false },
    bluetooth: { x: 80, y: top, w: 340, h: 280, open: false },
    radio: { x: 120, y: top, w: 380, h: 320, open: false },
    television: { x: 160, y: top, w: 400, h: 340, open: false },
    node: { x: Math.max(16, vw - 360), y: top, w: 340, h: 360, open: false },
    block: { x: 48, y: top + 12, w: 380, h: 420, open: false },
    plates: { x: 72, y: top + 28, w: 360, h: 420, open: false },
    kit: { x: 24, y: top + 8, w: 400, h: 520, open: false },
    audit: { x: 36, y: top + 20, w: 340, h: 480, open: false },
    wire: { x: 28, y: top + 8, w: 420, h: 640, open: false },
    post: { x: 52, y: top + 24, w: 400, h: 520, open: false },
    lookup: { x: 64, y: top + 32, w: 400, h: 480, open: false },
    source: { x: 20, y: top + 8, w: 520, h: 640, open: false },
    market: { x: 40, y: top + 16, w: 380, h: 560, open: false },
  };
  return MODULES.map((mod, index) => {
    const spot = place[mod.id];
    return {
      id: mod.id,
      title: mod.title,
      open: spot.open,
      minimized: false,
      x: Math.min(spot.x, Math.max(8, vw - spot.w - 8)),
      y: Math.min(spot.y, Math.max(top, vh - 120)),
      w: Math.min(spot.w, vw - 16),
      h: spot.h,
      z: index + 1,
    };
  });
}

function closedWindows(): Win[] {
  return MODULES.map((mod, index) => ({
    id: mod.id,
    title: mod.title,
    open: false,
    minimized: false,
    x: 16,
    y: 72,
    w: 340,
    h: 280,
    z: index + 1,
  }));
}

function focusWindows(windows: Win[], id: ModuleId): Win[] {
  return windows.map((win) =>
    win.id === id
      ? { ...win, open: true, minimized: false, z: 2 }
      : { ...win, open: false, minimized: false, z: 1 },
  );
}

type DeskState = {
  search: string;
  frozen: boolean;
  reheatToken: number;
  fitToken: number;
  focusToken: number;
  selectedNode: string | null;
  pinEpoch: number;
  frames: Frame[];
  seq: number;
  sessionStart: number;
  selectedFrame: number | null;
  field: Field | null;
  filter: string;
  capture: boolean;
  hexWidth: 8 | 16;
  hardware: HardwareProfile | null;
  metrics: Metrics;
  windows: Win[];
  graph: GraphParams;
  fieldOpen: boolean;
  demo: boolean;
  graphEpoch: number;
  session: ScanSession | null;
  setSearch: (value: string) => void;
  setFrozen: (value: boolean) => void;
  reheat: () => void;
  fit: () => void;
  focusMatches: () => void;
  selectNode: (id: string | null) => void;
  bumpPin: () => void;
  pushFrame: (draft: FrameDraft) => void;
  clearFrames: () => void;
  selectFrame: (no: number, field?: Field | null) => void;
  setField: (field: Field | null) => void;
  setFilter: (value: string) => void;
  setCapture: (value: boolean) => void;
  setHexWidth: (value: 8 | 16) => void;
  setHardware: (hardware: HardwareProfile) => void;
  patchLink: (patch: Partial<Metrics> & { history?: boolean }) => void;
  setRadio: (radio: Metrics["radio"]) => void;
  setRaster: (raster: Metrics["raster"]) => void;
  setBle: (name: string | null, battery: number | null, error: string | null) => void;
  openModule: (id: ModuleId) => void;
  closeModule: (id: ModuleId) => void;
  toggleModule: (id: ModuleId) => void;
  moveWindow: (id: ModuleId, x: number, y: number) => void;
  resizeWindow: (id: ModuleId, w: number, h: number) => void;
  setGraph: (patch: Partial<GraphParams>) => void;
  setFieldOpen: (value: boolean) => void;
  resetLayout: () => void;
  hydrate: () => void;
  scopeNode: (id: string) => void;
  setDemo: (demo: boolean) => void;
  startSession: (preset: SessionPreset) => void;
  stopSession: () => void;
  wipeObservations: () => void;
};

const KEY = "frame9.desk.v1";

export function clampWin(win: Win, vw: number, vh: number): Win {
  const w = Math.max(200, Math.min(win.w, vw - 8));
  const h = Math.max(160, Math.min(win.h, vh - 48));
  return {
    ...win,
    w,
    h,
    x: Math.min(Math.max(0, win.x), Math.max(0, vw - 48)),
    y: Math.min(Math.max(0, win.y), Math.max(0, vh - 48)),
  };
}

export const useDesk = create<DeskState>((set, get) => ({
  search: "",
  frozen: false,
  reheatToken: 0,
  fitToken: 0,
  focusToken: 0,
  selectedNode: null,
  pinEpoch: 0,
  frames: [],
  seq: 1,
  sessionStart: 0,
  selectedFrame: null,
  field: null,
  filter: "",
  capture: true,
  hexWidth: 16,
  hardware: null,
  metrics: emptyMetrics(),
  windows: closedWindows(),
  graph: { charge: 170, link: 150, labels: true },
  fieldOpen: false,
  demo: false,
  graphEpoch: 0,
  session: null,
  setSearch: (search) => set({ search }),
  setFrozen: (frozen) => set({ frozen }),
  reheat: () => set((s) => ({ frozen: false, reheatToken: s.reheatToken + 1 })),
  fit: () => set((s) => ({ fitToken: s.fitToken + 1 })),
  focusMatches: () => set((s) => ({ focusToken: s.focusToken + 1 })),
  selectNode: (id) =>
    set((s) => ({
      selectedNode: id,
      windows: id ? focusWindows(s.windows, "node") : s.windows,
    })),
  bumpPin: () => set((s) => ({ pinEpoch: s.pinEpoch + 1 })),
  pushFrame: (draft) => {
    const state = get();
    if (!state.capture) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const windowMs = state.metrics.ppsWindow.filter((t) => now - t < 1000);
    windowMs.push(now);
    const frame: Frame = { ...draft, no: state.seq };
    const created = noteObservation({
      source: frame.source,
      srcNode: frame.srcNode,
      dstNode: frame.dstNode,
      info: frame.info,
      demo: state.demo,
    });
    set({
      seq: state.seq + 1,
      frames: [frame, ...state.frames].slice(0, 320),
      selectedFrame: state.selectedFrame,
      graphEpoch: created ? state.graphEpoch + 1 : state.graphEpoch,
      metrics: { ...state.metrics, pps: windowMs.length, ppsWindow: windowMs },
    });
  },
  clearFrames: () => set((s) => ({ frames: [], selectedFrame: null, field: null, metrics: { ...s.metrics, pps: 0, ppsWindow: [] } })),
  selectFrame: (no, field = null) => set({ selectedFrame: no, field }),
  setField: (field) => set({ field }),
  setFilter: (filter) => set({ filter }),
  setCapture: (capture) => set({ capture }),
  setHexWidth: (hexWidth) => set({ hexWidth }),
  setHardware: (hardware) =>
    set((s) => ({
      hardware,
      hexWidth: hardware.klass === "phone" ? 8 : s.hexWidth,
      metrics: {
        ...s.metrics,
        online: hardware.online,
        downlink: hardware.connection.downlink,
        rtt: hardware.connection.rtt,
        effectiveType: hardware.connection.effectiveType,
        linkType: hardware.connection.type,
        saveData: hardware.connection.saveData,
      },
    })),
  patchLink: (patch) =>
    set((s) => {
      const { history, ...rest } = patch;
      const historyRow = history
        ? [...s.metrics.linkHistory, { down: rest.downlink ?? s.metrics.downlink, rtt: rest.rtt ?? s.metrics.rtt }].slice(-48)
        : s.metrics.linkHistory;
      return {
        metrics: {
          ...s.metrics,
          ...rest,
          linkHistory: historyRow,
          pps: s.metrics.pps,
          ppsWindow: s.metrics.ppsWindow,
        },
      };
    }),
  setRadio: (radio) => set((s) => ({ metrics: { ...s.metrics, radio } })),
  setRaster: (raster) => set((s) => ({ metrics: { ...s.metrics, raster } })),
  setBle: (bleName, bleBattery, bleError) => set((s) => ({ metrics: { ...s.metrics, bleName, bleBattery, bleError } })),
  openModule: (id) => set((s) => ({ windows: focusWindows(s.windows, id) })),
  closeModule: (id) => set((s) => ({ windows: s.windows.map((win) => (win.id === id ? { ...win, open: false } : win)) })),
  toggleModule: (id) => {
    const win = get().windows.find((item) => item.id === id);
    if (!win || !win.open || win.minimized) get().openModule(id);
    else get().closeModule(id);
  },
  moveWindow: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((win) =>
        win.id === id ? clampWin({ ...win, x, y }, window.innerWidth, window.innerHeight) : win,
      ),
    })),
  resizeWindow: (id, w, h) =>
    set((s) => ({
      windows: s.windows.map((win) =>
        win.id === id ? clampWin({ ...win, w, h }, window.innerWidth, window.innerHeight) : win,
      ),
    })),
  setGraph: (patch) => set((s) => ({ graph: { ...s.graph, ...patch } })),
  setFieldOpen: (fieldOpen) => set({ fieldOpen }),
  resetLayout: () => set({ windows: defaultWindows(window.innerWidth, window.innerHeight) }),
  hydrate: () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let windows = defaultWindows(vw, vh);
    let graph = get().graph;
    let filter = get().filter;
    let hexWidth = vw < 800 ? 8 : get().hexWidth;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          windows?: Win[];
          graph?: GraphParams;
          filter?: string;
          hexWidth?: 8 | 16;
        };
        if (Array.isArray(saved.windows)) {
          windows = defaultWindows(vw, vh).map((win) => {
            const found = saved.windows?.find((item) => item.id === win.id);
            return found ? clampWin({ ...win, ...found, title: win.title }, vw, vh) : win;
          });
        }
        if (saved.graph) graph = { ...graph, ...saved.graph };
        if (typeof saved.filter === "string") filter = saved.filter;
        if (saved.hexWidth === 8 || saved.hexWidth === 16) hexWidth = saved.hexWidth;
      }
    } catch {
      windows = defaultWindows(vw, vh);
    }
    set({ windows, graph, filter, hexWidth, sessionStart: performance.now() });
  },
  scopeNode: (id) => {
    set({ filter: `node:${id}` });
    get().openModule("frames");
  },
  setDemo: (demo) => {
    if (demo) showDemoWorld();
    else showLiveWorld();
    set((s) => ({
      demo,
      frames: [],
      selectedFrame: null,
      field: null,
      session: demo ? null : s.session,
      graphEpoch: s.graphEpoch + 1,
      fitToken: s.fitToken + 1,
      metrics: { ...s.metrics, pps: 0, ppsWindow: [] },
    }));
  },
  startSession: (preset) => {
    const now = performance.now();
    const until = preset === "PULSE" ? now + 20_000 : preset === "SURVEY" ? now + 180_000 : null;
    set({ session: { preset, startedAt: now, until }, sessionStart: now, capture: true });
  },
  stopSession: () => set({ session: null }),
  wipeObservations: () => {
    if (!get().demo) showLiveWorld();
    set((s) => ({
      frames: [],
      selectedFrame: null,
      field: null,
      session: null,
      graphEpoch: s.graphEpoch + 1,
      fitToken: s.fitToken + 1,
      metrics: { ...s.metrics, pps: 0, ppsWindow: [] },
    }));
  },
}));

export function persistDesk() {
  const s = useDesk.getState();
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ windows: s.windows, graph: s.graph, filter: s.filter, hexWidth: s.hexWidth }),
    );
  } catch {
    /* private mode */
  }
}
