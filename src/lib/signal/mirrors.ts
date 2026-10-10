import { create } from "zustand";

export type MirrorLayer = "observe" | "analogue" | "admin";
export type MirrorDomain = "host" | "ether" | "fabric";
export type MirrorSkill = "meter" | "trace" | "mirror";
export type MirrorId = `${MirrorLayer}.${MirrorDomain}.${MirrorSkill}`;

export type MirrorSpec = {
  id: MirrorId;
  title: string;
  layer: MirrorLayer;
  domain: MirrorDomain;
  skill: MirrorSkill;
  power: string;
  usage: string;
  art: string;
};

const LAYERS: MirrorLayer[] = ["observe", "analogue", "admin"];
const DOMAINS: MirrorDomain[] = ["host", "ether", "fabric"];
const SKILLS: MirrorSkill[] = ["meter", "trace", "mirror"];

const COPY: Record<MirrorId, { power: string; usage: string }> = {
  "observe.host.meter": {
    power: "Reads the live host order: class, cores, memory, pointer.",
    usage: "Open on a new machine. The numbers are whatever this browser published.",
  },
  "observe.host.trace": {
    power: "Traces screen, GPU, and storage quota for this boot.",
    usage: "Use it to see which device the page actually landed on.",
  },
  "observe.host.mirror": {
    power: "Holds this host next to the last remembered host.",
    usage: "Move the file to a laptop and reopen. The earlier phone stays in memory.",
  },
  "observe.ether.meter": {
    power: "Meters the link the stack admits: online, type, downlink, RTT.",
    usage: "It is not a scan. If the API is missing, the needle stays down.",
  },
  "observe.ether.trace": {
    power: "Traces Bluetooth and USB as available or missing, not as a device list.",
    usage: "Attach a radio only from the window that asks you to pick one.",
  },
  "observe.ether.mirror": {
    power: "Mirrors link type against Bluetooth presence.",
    usage: "A missing API stays missing. Nothing is filled in.",
  },
  "observe.fabric.meter": {
    power: "Meters observations per second on the fabric.",
    usage: "Start PULSE, SURVEY, or WATCH. Demo frames are labeled synthetic.",
  },
  "observe.fabric.trace": {
    power: "Traces whether the field is live or frozen.",
    usage: "Freeze stops the simulation. The count does not invent frames.",
  },
  "observe.fabric.mirror": {
    power: "Mirrors catalog nodes against the current search.",
    usage: "Type in the desk search. This window only counts matches.",
  },
  "analogue.host.meter": {
    power: "Draws cores as a needle on an arc.",
    usage: "Same host order as the digital pane, read like a meter.",
  },
  "analogue.host.trace": {
    power: "Draws battery, when a cell exists, as a second needle.",
    usage: "A desktop with no battery API leaves the needle at rest.",
  },
  "analogue.host.mirror": {
    power: "Pairs pointer kind and touch points on two arcs.",
    usage: "A mouse reads fine. A finger reads coarse.",
  },
  "analogue.ether.meter": {
    power: "Draws round-trip time as a needle.",
    usage: "Unpublished RTT does not become a number.",
  },
  "analogue.ether.trace": {
    power: "Draws downlink megabits as a short tape.",
    usage: "The tape is the Network Information value, or empty.",
  },
  "analogue.ether.mirror": {
    power: "Two lamps: link up, Bluetooth API present.",
    usage: "Lamps are capability, not a heard transmitter.",
  },
  "analogue.fabric.meter": {
    power: "Draws the live rate as a needle.",
    usage: "The arc tops at 20 observations a second.",
  },
  "analogue.fabric.trace": {
    power: "A lamp for frozen or moving.",
    usage: "It follows the desk freeze control.",
  },
  "analogue.fabric.mirror": {
    power: "Search hits against the whole catalog, as a split meter.",
    usage: "Clear the search and the right side returns to the full count.",
  },
  "admin.host.meter": {
    power: "Lists every bus this browser exposes: USB, HID, serial, MIDI, gamepad.",
    usage: "Sign in as admin. A missing bus is marked unsupported.",
  },
  "admin.host.trace": {
    power: "Arms the motion sensor once, if the host has one.",
    usage: "You start it. A refusal is shown as a refusal.",
  },
  "admin.host.mirror": {
    power: "Diffs this boot against every host kept in memory.",
    usage: "Download the desk onto another computer and the list grows.",
  },
  "admin.ether.meter": {
    power: "States each wireless API: link, Bluetooth pick, and what cannot be heard.",
    usage: "Hidden SSIDs, private radio, and TV carriers stay unreachable.",
  },
  "admin.ether.trace": {
    power: "Asks you to pick one Bluetooth device or one USB device.",
    usage: "The browser chooser is the scan. There is no silent inquiry.",
  },
  "admin.ether.mirror": {
    power: "Mirrors the capability matrix without adding rows that have no API.",
    usage: "Read it before believing a module can hear a transmitter.",
  },
  "admin.fabric.meter": {
    power: "Shows the signed-in role and refuses admin tools otherwise.",
    usage: "Admin is only the account that matches the desk owner, and only while signed in.",
  },
  "admin.fabric.trace": {
    power: "Keeps a local note with the device memory.",
    usage: "The note stays in this browser. It is not uploaded.",
  },
  "admin.fabric.mirror": {
    power: "Writes the boundary: no monitor mode, no hidden-signal inventory, no demodulator.",
    usage: "Use it when a reading looks too complete. It should not.",
  },
};

export const MIRRORS: MirrorSpec[] = LAYERS.flatMap((layer) =>
  DOMAINS.flatMap((domain) =>
    SKILLS.map((skill) => {
      const id = `${layer}.${domain}.${skill}` as MirrorId;
      const copy = COPY[id];
      return {
        id,
        title: `${layer} / ${domain} / ${skill}`,
        layer,
        domain,
        skill,
        power: copy.power,
        usage: copy.usage,
        art: layer === "admin" ? "/art-admin.jpg" : "/field-plate.jpg",
      };
    }),
  ),
);

export type MirrorWin = {
  id: MirrorId;
  open: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
};

type MirrorState = {
  atlas: boolean;
  windows: MirrorWin[];
  toggleAtlas: () => void;
  open: (id: MirrorId) => void;
  close: (id: MirrorId) => void;
  move: (id: MirrorId, x: number, y: number) => void;
  resize: (id: MirrorId, w: number, h: number) => void;
};

function place(index: number): Pick<MirrorWin, "x" | "y" | "w" | "h"> {
  const col = index % 3;
  const row = Math.floor(index / 3) % 3;
  return { x: 24 + col * 28, y: 96 + row * 24, w: 360, h: 320 };
}

export const useMirrors = create<MirrorState>((set) => ({
  atlas: false,
  windows: MIRRORS.map((spec, index) => ({ id: spec.id, open: false, z: index + 1, ...place(index) })),
  toggleAtlas: () => set((s) => ({ atlas: !s.atlas })),
  open: (id) =>
    set((s) => {
      const max = Math.max(1, ...s.windows.map((win) => win.z));
      return { windows: s.windows.map((win) => (win.id === id ? { ...win, open: true, z: max + 1 } : win)) };
    }),
  close: (id) => set((s) => ({ windows: s.windows.map((win) => (win.id === id ? { ...win, open: false } : win)) })),
  move: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((win) => (win.id === id ? { ...win, x: Math.max(0, x), y: Math.max(0, y) } : win)),
    })),
  resize: (id, w, h) =>
    set((s) => ({
      windows: s.windows.map((win) =>
        win.id === id ? { ...win, w: Math.max(240, w), h: Math.max(200, h) } : win,
      ),
    })),
}));

export function mirrorSpec(id: MirrorId): MirrorSpec {
  return MIRRORS.find((spec) => spec.id === id) ?? MIRRORS[0];
}

export function focusedMirror(): MirrorId | null {
  const open = useMirrors.getState().windows.filter((win) => win.open);
  if (!open.length) return null;
  return open.sort((a, b) => b.z - a.z)[0].id;
}
