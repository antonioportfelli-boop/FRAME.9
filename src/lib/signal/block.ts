import { create } from "zustand";

export type BlockHit = {
  at: number;
  host: string;
  action: "blocked" | "watched" | "seen";
  detail: string;
};

const SEED = [
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "adservice.google.com",
  "adnxs.com",
  "criteo.com",
  "taboola.com",
  "outbrain.com",
  "scorecardresearch.com",
  "hotjar.com",
];

const KEY = "frame9.block.v1";

type BlockState = {
  enabled: boolean;
  mode: "list" | "strict" | "observe";
  seed: boolean;
  blocked: string[];
  allowed: string[];
  watched: string[];
  hits: BlockHit[];
  hydrate: () => void;
  setEnabled: (enabled: boolean) => void;
  setMode: (mode: "list" | "strict" | "observe") => void;
  setSeed: (seed: boolean) => void;
  choose: (mode: "off" | "observe" | "list" | "strict") => void;
  addBlocked: (host: string) => void;
  addAllowed: (host: string) => void;
  addWatched: (host: string) => void;
  push: (hit: BlockHit) => void;
};

function cleanHost(value: string): string | null {
  const host = value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]?.replace(/:\d+$/, "") ?? "";
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
  return host;
}

function listed(host: string, rules: string[]): boolean {
  return rules.some((rule) => host === rule || host.endsWith(`.${rule}`));
}

function save(state: BlockState) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      enabled: state.enabled,
      mode: state.mode,
      seed: state.seed,
      blocked: state.blocked,
      allowed: state.allowed,
      watched: state.watched,
    }),
  );
}

export const useBlock = create<BlockState>((set, get) => ({
  enabled: true,
  mode: "list",
  seed: true,
  blocked: SEED,
  allowed: [],
  watched: [],
  hits: [],
  hydrate: () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { enabled?: boolean; mode?: string; seed?: boolean; blocked?: string[]; allowed?: string[]; watched?: string[] };
      set({
        enabled: saved.enabled !== false,
        mode: saved.mode === "strict" || saved.mode === "observe" ? saved.mode : "list",
        seed: saved.seed !== false,
        blocked: Array.isArray(saved.blocked) && saved.blocked.length ? saved.blocked : SEED,
        allowed: Array.isArray(saved.allowed) ? saved.allowed : [],
        watched: Array.isArray(saved.watched) ? saved.watched : [],
      });
    } catch {
      set({ enabled: true, mode: "list", seed: true, blocked: SEED, allowed: [], watched: [] });
    }
  },
  setEnabled: (enabled) => {
    const next = { ...get(), enabled };
    save(next);
    set({ enabled });
  },
  setSeed: (seed) => {
    const next = { ...get(), seed };
    save(next);
    set({ seed });
  },
  setMode: (mode) => {
    const next = { ...get(), mode, enabled: true };
    save(next);
    set({ mode, enabled: true });
  },
  choose: (mode) => {
    if (mode === "off") {
      const next = { ...get(), enabled: false };
      save(next);
      set({ enabled: false });
      return;
    }
    const next = { ...get(), enabled: true, mode };
    save(next);
    set({ enabled: true, mode });
  },
  addBlocked: (value) => {
    const host = cleanHost(value);
    if (!host) return;
    const blocked = get().blocked.includes(host) ? get().blocked : [host, ...get().blocked];
    const next = { ...get(), blocked };
    save(next);
    set({ blocked });
  },
  addAllowed: (value) => {
    const host = cleanHost(value);
    if (!host) return;
    const allowed = get().allowed.includes(host) ? get().allowed : [host, ...get().allowed];
    const next = { ...get(), allowed };
    save(next);
    set({ allowed });
  },
  addWatched: (value) => {
    const host = cleanHost(value);
    if (!host) return;
    const watched = get().watched.includes(host) ? get().watched : [host, ...get().watched];
    const next = { ...get(), watched };
    save(next);
    set({ watched });
  },
  push: (hit) => set((state) => ({ hits: [hit, ...state.hits].slice(0, 80) })),
}));

function hostOf(input: RequestInfo | URL): string | null {
  try {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return new URL(raw, window.location.href).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function judge(host: string | null): "allow" | "blocked" | "watched" {
  if (!host || host === window.location.hostname) return "allow";
  const state = useBlock.getState();
  if (!state.enabled) return listed(host, state.watched) ? "watched" : "allow";
  if (state.mode === "observe") return "watched";
  if (state.seed && listed(host, SEED)) return "blocked";
  if (listed(host, state.blocked.filter((item) => !SEED.includes(item)))) return "blocked";
  if (state.mode === "strict" && !listed(host, state.allowed)) return "blocked";
  if (listed(host, state.watched)) return "watched";
  return "allow";
}

let installed = false;

export function installBlock() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  useBlock.getState().hydrate();
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const host = hostOf(input);
    const verdict = judge(host);
    if (host && verdict !== "allow") {
      useBlock.getState().push({
        at: Date.now(),
        host,
        action: verdict,
        detail: verdict === "blocked" ? "Request stopped before it left the page." : "Watched. The request was allowed.",
      });
    }
    if (verdict === "blocked") {
      return Promise.resolve(new Response(null, { status: 403, statusText: "9block" }));
    }
    return original(input, init);
  };

  const beacon = navigator.sendBeacon?.bind(navigator);
  if (beacon) {
    navigator.sendBeacon = (url: string | URL, data?: BodyInit | null) => {
      const host = hostOf(url);
      if (judge(host) === "blocked") {
        useBlock.getState().push({ at: Date.now(), host: host ?? "", action: "blocked", detail: "Beacon stopped before it left the page." });
        return false;
      }
      return beacon(url, data);
    };
  }

  const noteResource = (name: string) => {
    let host: string | null = null;
    try {
      host = new URL(name).hostname.toLowerCase();
    } catch {
      return;
    }
    if (!host || host === window.location.hostname) return;
    const verdict = judge(host);
    useBlock.getState().push({
      at: Date.now(),
      host,
      action: verdict === "allow" ? "seen" : verdict,
      detail: "Resource timing. Only requests this page made.",
    });
  };

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) noteResource(entry.name);
    });
    observer.observe({ type: "resource", buffered: true });
  } catch {
    for (const entry of performance.getEntriesByType("resource")) noteResource(entry.name);
  }
}

export function browserName(): string {
  const extra = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } };
  const brands = extra.userAgentData?.brands?.map((item) => item.brand).join(" ") ?? "";
  const ua = `${brands} ${navigator.userAgent}`;
  if (/Edg\//.test(ua)) return "Edge";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "this browser";
}
