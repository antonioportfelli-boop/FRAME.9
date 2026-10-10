import { create } from "zustand";
import type { HardwareProfile } from "@/lib/signal/hardware";

export type RememberedHost = {
  at: string;
  klass: string;
  cores: number;
  platform: string;
  gpu: string | null;
  screen: string;
  pointer: string;
};

type MemoryState = {
  hosts: RememberedHost[];
  note: string;
  hostReport: string | null;
  hydrate: () => void;
  remember: (hardware: HardwareProfile) => void;
  setNote: (note: string) => void;
  setHostReport: (text: string) => void;
};

const KEY = "frame9.memory.v1";

function keyOf(host: { klass: string; cores: number; platform: string; gpu: string | null; screen: string }): string {
  return [host.klass, host.cores, host.platform, host.gpu ?? "", host.screen].join("|");
}

export const useMemory = create<MemoryState>((set, get) => ({
  hosts: [],
  note: "",
  hostReport: null,
  hydrate: () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { hosts?: RememberedHost[]; note?: string; hostReport?: string };
      set({
        hosts: Array.isArray(saved.hosts) ? saved.hosts.slice(0, 12) : [],
        note: typeof saved.note === "string" ? saved.note : "",
        hostReport: typeof saved.hostReport === "string" ? saved.hostReport : null,
      });
    } catch {
      set({ hosts: [], note: "" });
    }
  },
  remember: (hardware) => {
    const next: RememberedHost = {
      at: new Date().toISOString(),
      klass: hardware.klass,
      cores: hardware.cores,
      platform: hardware.platform,
      gpu: hardware.gpu,
      screen: `${hardware.screen.w}×${hardware.screen.h}`,
      pointer: hardware.pointer,
    };
    const prev = get().hosts[0];
    if (prev && keyOf(prev) === keyOf(next)) return;
    const hosts = [next, ...get().hosts].slice(0, 12);
    const note = get().note;
    localStorage.setItem(KEY, JSON.stringify({ hosts, note, hostReport: get().hostReport }));
    set({ hosts });
  },
  setNote: (note) => {
    const hosts = get().hosts;
    localStorage.setItem(KEY, JSON.stringify({ hosts, note, hostReport: get().hostReport }));
    set({ note });
  },
  setHostReport: (text) => {
    const hostReport = text.slice(0, 8000);
    const hosts = get().hosts;
    const note = get().note;
    localStorage.setItem(KEY, JSON.stringify({ hosts, note, hostReport }));
    set({ hostReport });
  },
}));
