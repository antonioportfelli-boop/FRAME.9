export type Domain = "host" | "link" | "stack" | "ble" | "radio" | "tv";

export type Shape = "circle" | "square" | "tri" | "rect";

export type Origin = "host" | "bench";

export type Source =
  | "LIVE_ANDROID_WIFI"
  | "LIVE_ANDROID_WIFI_RTT"
  | "LIVE_ANDROID_BLE"
  | "LIVE_ANDROID_VPN"
  | "LIVE_HOST"
  | "LIVE_WEB_LINK"
  | "LIVE_WEB_BLUETOOTH"
  | "LIVE_CAMERA"
  | "LIVE_AUDIO"
  | "LIVE_USB"
  | "LIVE_USB_RF"
  | "LIVE_USB_DVB"
  | "OPEN_DATA_IANA"
  | "OPEN_DATA_RDAP"
  | "OPEN_DATA_TTJA"
  | "OPEN_DATA_VENDOR"
  | "USER_ASSERTED"
  | "SYNTHETIC_DEMO";

export type CapState =
  | "READY"
  | "PERMISSION_REQUIRED"
  | "USER_CONSENT_REQUIRED"
  | "UNSUPPORTED_HARDWARE"
  | "NOT_CONNECTED"
  | "DISABLED"
  | "ERROR";

export type ModuleId =
  | "frames"
  | "decode"
  | "hex"
  | "host"
  | "wifi"
  | "bluetooth"
  | "radio"
  | "television"
  | "node"
  | "block"
  | "plates"
  | "kit"
  | "audit"
  | "wire"
  | "market"
  | "post"
  | "lookup"
  | "source";

export type Field = {
  label: string;
  value: string;
  offset: number;
  length: number;
};

export type Layer = {
  name: string;
  fields: Field[];
};

export type Frame = {
  no: number;
  rel: number;
  src: string;
  dst: string;
  proto: string;
  len: number;
  info: string;
  origin: Origin;
  domain: Domain;
  srcNode: string;
  dstNode: string;
  layers: Layer[];
  bytes: Uint8Array | null;
  source: Source;
};

export type FrameDraft = Omit<Frame, "no">;

export type CatalogNode = {
  id: string;
  label: string;
  kind: string;
  domain: Domain;
  shape: Shape;
  r: number;
  blurb: string;
};

export type CatalogEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export const MODULES: { id: ModuleId; title: string; short: string }[] = [
  { id: "host", title: "Host", short: "Order" },
  { id: "audit", title: "Audit", short: "Truth" },
  { id: "market", title: "Market", short: "Piir" },
  { id: "block", title: "9block", short: "Filter" },
  { id: "wire", title: "Wire", short: "Tunnel" },
  { id: "lookup", title: "Lookup", short: "RDAP" },
  { id: "source", title: "Source", short: "Remix" },
  { id: "post", title: "Post", short: "Reply" },
  { id: "frames", title: "Frames", short: "List" },
  { id: "decode", title: "Decode", short: "Tree" },
  { id: "hex", title: "Hex", short: "Bytes" },
  { id: "wifi", title: "Wi-Fi", short: "Link" },
  { id: "bluetooth", title: "Bluetooth", short: "BLE" },
  { id: "radio", title: "Radio", short: "IF" },
  { id: "television", title: "Television", short: "Raster" },
  { id: "node", title: "Node", short: "Node" },
  { id: "plates", title: "Plates", short: "Art" },
  { id: "kit", title: "Kit", short: "25" },
];

export const NODES: CatalogNode[] = [
  {
    id: "host",
    label: "This host",
    kind: "station",
    domain: "host",
    shape: "circle",
    r: 18,
    blurb: "The machine running the desk. Metrics on this node come from the browser, not from a monitor-mode NIC.",
  },
  {
    id: "nic",
    label: "NIC",
    kind: "interface",
    domain: "link",
    shape: "circle",
    r: 13,
    blurb: "Local radio and wired interface as the stack sees it. The page cannot open 802.11 monitor mode.",
  },
  {
    id: "sta",
    label: "STA",
    kind: "station",
    domain: "link",
    shape: "circle",
    r: 13,
    blurb: "Bench station 10.9.0.20 / 02:09:4e:45:54:10 associated to NET9-LAB.",
  },
  {
    id: "ap",
    label: "AP NET9-LAB",
    kind: "access-point",
    domain: "link",
    shape: "circle",
    r: 14,
    blurb: "Bench BSS. Beacon and probe frames are built to 802.11 layout and marked BENCH.",
  },
  {
    id: "gw",
    label: "Gateway",
    kind: "router",
    domain: "link",
    shape: "circle",
    r: 13,
    blurb: "Bench gateway 10.9.0.1. Real path RTT, when the host publishes it, is a separate HOST frame.",
  },
  {
    id: "dhcp",
    label: "DHCP",
    kind: "protocol",
    domain: "stack",
    shape: "circle",
    r: 9,
    blurb: "Discover from the bench STA. BOOTP header follows RFC 2131; option 53 is message type.",
  },
  {
    id: "dns",
    label: "DNS",
    kind: "protocol",
    domain: "stack",
    shape: "circle",
    r: 9,
    blurb: "Standard query A net9.lab. Header flags are RD=1, one question, no answers.",
  },
  {
    id: "ntp",
    label: "NTP",
    kind: "protocol",
    domain: "stack",
    shape: "circle",
    r: 9,
    blurb: "Clock peer on the bench fabric. Not queried live; the host clock is read locally in the Host module.",
  },
  {
    id: "tcp",
    label: "TCP",
    kind: "protocol",
    domain: "stack",
    shape: "circle",
    r: 9,
    blurb: "SYN toward 10.9.0.1:443. Checksum covers the IPv4 pseudo-header.",
  },
  {
    id: "udp",
    label: "UDP",
    kind: "protocol",
    domain: "stack",
    shape: "circle",
    r: 9,
    blurb: "Datagram transport for DHCP and DNS on the bench. IPv4 UDP checksum is computed, not zeroed.",
  },
  {
    id: "ble",
    label: "BLE ctrl",
    kind: "controller",
    domain: "ble",
    shape: "square",
    r: 13,
    blurb: "Bluetooth Low Energy controller. Live attach uses Web Bluetooth only after you pick a device.",
  },
  {
    id: "hci",
    label: "HCI",
    kind: "protocol",
    domain: "ble",
    shape: "square",
    r: 9,
    blurb: "Host controller interface between this host and the controller. The page does not see HCI sockets.",
  },
  {
    id: "att",
    label: "ATT",
    kind: "protocol",
    domain: "ble",
    shape: "square",
    r: 9,
    blurb: "Attribute protocol. Bench read request uses opcode 0x0A and a 16-bit handle.",
  },
  {
    id: "hid",
    label: "HID",
    kind: "peripheral",
    domain: "ble",
    shape: "square",
    r: 12,
    blurb: "Bench HID peripheral. A granted Web Bluetooth device is drawn onto this node when you attach one.",
  },
  {
    id: "tag",
    label: "Tag",
    kind: "peripheral",
    domain: "ble",
    shape: "square",
    r: 12,
    blurb: "Connectable undirected advertiser NET9-TAG. AD flags 0x06, complete local name.",
  },
  {
    id: "leaudio",
    label: "LE audio",
    kind: "peripheral",
    domain: "ble",
    shape: "square",
    r: 12,
    blurb: "Isochronous sink on the bench. The live audio path in Radio is the microphone, not LE Audio.",
  },
  {
    id: "sdr",
    label: "Front end",
    kind: "transducer",
    domain: "radio",
    shape: "tri",
    r: 13,
    blurb: "Acoustic front end. Arming Radio opens the microphone the host actually exposes. There is no RF tuner.",
  },
  {
    id: "fm",
    label: "FM 98.4",
    kind: "carrier",
    domain: "radio",
    shape: "tri",
    r: 12,
    blurb: "Bench FM carrier used as the parent of RDS groups. Peak hertz in HOST frames is measured, not tuned.",
  },
  {
    id: "rds",
    label: "RDS",
    kind: "protocol",
    domain: "radio",
    shape: "tri",
    r: 9,
    blurb: "Group 0A program-service blocks. Checkwords are omitted and labeled as such.",
  },
  {
    id: "dab",
    label: "DAB",
    kind: "ensemble",
    domain: "radio",
    shape: "tri",
    r: 12,
    blurb: "FIG 1/0 ensemble label NET9 DAB. Extension is packed in the low nibble of the type-1 header byte.",
  },
  {
    id: "raster",
    label: "Raster",
    kind: "meter",
    domain: "tv",
    shape: "rect",
    r: 13,
    blurb: "Luma, chroma balance, and frame-to-frame motion. Pattern mode is generated here; camera and display are live.",
  },
  {
    id: "display",
    label: "Picture",
    kind: "input",
    domain: "tv",
    shape: "rect",
    r: 12,
    blurb: "Camera or display capture, chosen from what this host publishes. A page cannot tune DVB-T.",
  },
  {
    id: "dvb",
    label: "DVB mux",
    kind: "mux",
    domain: "tv",
    shape: "rect",
    r: 13,
    blurb: "Bench transport stream. Packets are 188 bytes, sync 0x47. CRC on PAT is not a real encoder CRC.",
  },
  {
    id: "pat",
    label: "PAT",
    kind: "table",
    domain: "tv",
    shape: "rect",
    r: 9,
    blurb: "Program association table, PID 0. One program, map PID 256.",
  },
  {
    id: "video",
    label: "PID 256",
    kind: "stream",
    domain: "tv",
    shape: "rect",
    r: 11,
    blurb: "Video PES. Payload unit start uses start code 00 00 01 E0.",
  },
  {
    id: "tvaudio",
    label: "PID 257",
    kind: "stream",
    domain: "tv",
    shape: "rect",
    r: 11,
    blurb: "Audio PES on the bench mux, stream id 0xC0.",
  },
];

export const EDGES: CatalogEdge[] = [
  { id: "e1", source: "host", target: "nic", label: "bus" },
  { id: "e2", source: "nic", target: "sta", label: "assoc" },
  { id: "e3", source: "sta", target: "ap", label: "beacon" },
  { id: "e4", source: "ap", target: "gw", label: "uplink" },
  { id: "e5", source: "sta", target: "dhcp", label: "dhcp" },
  { id: "e6", source: "dhcp", target: "udp", label: "udp/67" },
  { id: "e7", source: "sta", target: "dns", label: "dns" },
  { id: "e8", source: "dns", target: "udp", label: "udp/53" },
  { id: "e9", source: "gw", target: "ntp", label: "ntp" },
  { id: "e10", source: "host", target: "tcp", label: "socket" },
  { id: "e11", source: "tcp", target: "gw", label: "syn" },
  { id: "e12", source: "udp", target: "gw", label: "route" },
  { id: "e13", source: "nic", target: "ble", label: "coexist" },
  { id: "e14", source: "host", target: "hci", label: "hci" },
  { id: "e15", source: "hci", target: "ble", label: "ctrl" },
  { id: "e16", source: "ble", target: "att", label: "att" },
  { id: "e17", source: "att", target: "hid", label: "read" },
  { id: "e18", source: "ble", target: "tag", label: "adv" },
  { id: "e19", source: "ble", target: "leaudio", label: "iso" },
  { id: "e20", source: "host", target: "sdr", label: "audio in" },
  { id: "e21", source: "sdr", target: "fm", label: "if" },
  { id: "e22", source: "fm", target: "rds", label: "rds" },
  { id: "e23", source: "sdr", target: "dab", label: "ofdm" },
  { id: "e24", source: "host", target: "raster", label: "gpu" },
  { id: "e25", source: "display", target: "raster", label: "capture" },
  { id: "e26", source: "raster", target: "dvb", label: "ts" },
  { id: "e27", source: "dvb", target: "pat", label: "pid 0" },
  { id: "e28", source: "dvb", target: "video", label: "pid 256" },
  { id: "e29", source: "dvb", target: "tvaudio", label: "pid 257" },
];

const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));

export function nodeById(id: string): CatalogNode | undefined {
  return NODE_BY_ID.get(id);
}

export function neighbors(id: string): { edge: CatalogEdge; other: CatalogNode }[] {
  const out: { edge: CatalogEdge; other: CatalogNode }[] = [];
  for (const edge of EDGES) {
    if (edge.source === id) {
      const other = NODE_BY_ID.get(edge.target);
      if (other) out.push({ edge, other });
    } else if (edge.target === id) {
      const other = NODE_BY_ID.get(edge.source);
      if (other) out.push({ edge, other });
    }
  }
  return out;
}

export function nodeMatches(
  node: { id: string; label: string; kind: string; domain: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    node.label.toLowerCase().includes(q) ||
    node.id.toLowerCase().includes(q) ||
    node.kind.toLowerCase().includes(q) ||
    node.domain.toLowerCase().includes(q)
  );
}

export function matchFrame(frame: Frame, query: string): boolean {
  const raw = query.trim().toLowerCase();
  if (!raw) return true;
  return raw.split(/\s+/).every((part) => {
    const cut = part.indexOf(":");
    if (cut === -1) {
      const blob = `${frame.proto} ${frame.info} ${frame.src} ${frame.dst} ${frame.domain} ${frame.origin} ${frame.source}`.toLowerCase();
      return blob.includes(part);
    }
    const key = part.slice(0, cut);
    const value = part.slice(cut + 1);
    if (key === "proto") return frame.proto.toLowerCase().includes(value);
    if (key === "origin") return frame.origin === value;
    if (key === "source") return frame.source.toLowerCase().includes(value.toLowerCase());
    if (key === "domain") return frame.domain === value;
    if (key === "src") return frame.src.toLowerCase().includes(value);
    if (key === "dst") return frame.dst.toLowerCase().includes(value);
    if (key === "node") return frame.srcNode === value || frame.dstNode === value;
    return false;
  });
}
