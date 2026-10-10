import { EDGES, NODES, type Domain, type Shape, type Source } from "@/lib/signal/types";

export type SimNode = {
  id: string;
  label: string;
  kind: string;
  domain: Domain;
  shape: "circle" | "square" | "tri" | "rect";
  r: number;
  blurb: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
  pulse: number;
};

export type SimEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  heat: number;
};

export type World = {
  nodes: SimNode[];
  edges: SimEdge[];
  byId: Map<string, SimNode>;
};

const CENTERS: Record<Domain, [number, number]> = {
  host: [0, 0],
  link: [-280, -20],
  stack: [0, -250],
  ble: [300, -10],
  radio: [-200, 250],
  tv: [230, 250],
};

function build(): World {
  const counts = new Map<Domain, number>();
  for (const node of NODES) counts.set(node.domain, (counts.get(node.domain) ?? 0) + 1);
  const seen = new Map<Domain, number>();
  const nodes: SimNode[] = NODES.map((node) => {
    const i = seen.get(node.domain) ?? 0;
    seen.set(node.domain, i + 1);
    const n = counts.get(node.domain) ?? 1;
    const [cx, cy] = CENTERS[node.domain];
    const ang = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
    const rad = node.domain === "host" ? 0 : 92;
    return {
      ...node,
      x: cx + Math.cos(ang) * rad,
      y: cy + Math.sin(ang) * rad,
      vx: 0,
      vy: 0,
      pinned: false,
      pulse: 0,
    };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: SimEdge[] = EDGES.map((edge) => ({ ...edge, heat: 0 }));
  return { nodes, edges, byId };
}

let world: World | null = null;

function hostNode(): SimNode {
  return {
    id: "host",
    label: "This host",
    kind: "station",
    domain: "host",
    shape: "circle",
    r: 18,
    blurb: "The device running FRAME.9. Facts come from public host APIs. This is not a Wi-Fi scan.",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    pinned: false,
    pulse: 0,
  };
}

function liveHostWorld(): World {
  const node = hostNode();
  return { nodes: [node], edges: [], byId: new Map([[node.id, node]]) };
}

export function getWorld(): World {
  if (!world) world = liveHostWorld();
  return world;
}

export function showLiveWorld() {
  world = liveHostWorld();
}

export function showDemoWorld() {
  world = build();
}

export function upsertLiveNode(id: string, label: string, blurb: string, domain: Domain, shape: Shape): boolean {
  const current = getWorld();
  const existing = current.byId.get(id);
  if (existing) {
    existing.label = label;
    existing.blurb = blurb;
    existing.pulse = 1;
    return false;
  }
  const angle = current.nodes.length * 1.2;
  const node: SimNode = {
    id,
    label,
    blurb,
    domain,
    shape,
    kind: domain,
    r: 13,
    x: Math.cos(angle) * 180,
    y: Math.sin(angle) * 180,
    vx: 0,
    vy: 0,
    pinned: false,
    pulse: 1,
  };
  current.nodes.push(node);
  current.byId.set(id, node);
  if (id !== "host") {
    current.edges.push({ id: `live-${id}`, source: "host", target: id, label: "observed", heat: 1 });
  }
  return true;
}

export function noteObservation(frame: {
  source: Source;
  srcNode: string;
  dstNode: string;
  info: string;
  demo: boolean;
}): boolean {
  if (frame.demo || frame.source === "SYNTHETIC_DEMO") {
    markFrame(frame.srcNode, frame.dstNode);
    return false;
  }
  if (frame.source === "LIVE_WEB_LINK") {
    return upsertLiveNode(
      "nic",
      "Link",
      "Network Information API. Not an access-point scan and not raw 802.11.",
      "link",
      "circle",
    );
  }
  if (frame.source === "LIVE_AUDIO") {
    return upsertLiveNode(
      "audio",
      "Audio spectrum",
      "Microphone FFT. Acoustic frequency is not an RF carrier.",
      "radio",
      "tri",
    );
  }
  if (frame.source === "LIVE_CAMERA") {
    return upsertLiveNode(
      "picture",
      "Camera",
      "Picture meter. A visible object is not linked to a network entity unless you say so.",
      "tv",
      "rect",
    );
  }
  if (frame.source === "LIVE_WEB_BLUETOOTH") {
    return upsertLiveNode(
      "ble",
      frame.info.replace("User-selected device ", ""),
      "A device you selected. Not a passive advertisement scan. Owner is UNKNOWN.",
      "ble",
      "square",
    );
  }
  if (frame.source === "LIVE_USB") {
    return upsertLiveNode(
      frame.dstNode,
      frame.info,
      "USB device from the host API. No RF or DVB driver is loaded. Vendor id is not an owner.",
      "host",
      "square",
    );
  }
  if (frame.source === "USER_ASSERTED" && frame.dstNode === "browser") {
    return upsertLiveNode("browser", "Window", frame.info, "link", "rect");
  }
  if (frame.source === "LIVE_HOST" || frame.source === "USER_ASSERTED") {
    const current = getWorld();
    const node = current.byId.get(frame.dstNode) ?? current.byId.get("host");
    if (node) node.pulse = 1;
    return false;
  }
  if (frame.source === "OPEN_DATA_RDAP") {
    return upsertLiveNode(
      frame.dstNode,
      frame.info,
      "RDAP registry record. An address registrant is not a device owner.",
      "stack",
      "circle",
    );
  }
  return false;
}

export function markFrame(srcNode: string, dstNode: string) {
  const current = getWorld();
  const a = current.byId.get(srcNode);
  const b = current.byId.get(dstNode);
  if (a) a.pulse = 1;
  if (b) b.pulse = 1;
  for (const edge of current.edges) {
    const hit =
      (edge.source === srcNode && edge.target === dstNode) ||
      (edge.source === dstNode && edge.target === srcNode);
    if (hit) edge.heat = 1;
  }
}

export function unpinAll() {
  for (const node of getWorld().nodes) node.pinned = false;
}

export function step(
  current: World,
  opts: { charge: number; link: number; alpha: number; holdId: string | null },
) {
  for (const edge of current.edges) edge.heat *= 0.94;
  for (const node of current.nodes) node.pulse *= 0.9;
  if (opts.alpha <= 0.02) return;

  const nodes = current.nodes;
  const charge = opts.charge;
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      let dist2 = dx * dx + dy * dy;
      if (dist2 < 4) dist2 = 4;
      const dist = Math.sqrt(dist2);
      const force = charge / dist2;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (!a.pinned && a.id !== opts.holdId) {
        a.vx -= fx;
        a.vy -= fy;
      }
      if (!b.pinned && b.id !== opts.holdId) {
        b.vx += fx;
        b.vy += fy;
      }
    }
  }

  const k = 0.018;
  for (const edge of current.edges) {
    const a = current.byId.get(edge.source);
    const b = current.byId.get(edge.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 0.01;
    const mag = (dist - opts.link) * k;
    const fx = (dx / dist) * mag;
    const fy = (dy / dist) * mag;
    if (!a.pinned && a.id !== opts.holdId) {
      a.vx += fx;
      a.vy += fy;
    }
    if (!b.pinned && b.id !== opts.holdId) {
      b.vx -= fx;
      b.vy -= fy;
    }
  }

  for (const node of nodes) {
    if (node.pinned || node.id === opts.holdId) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }
    node.vx += -node.x * 0.008;
    node.vy += -node.y * 0.008;
    node.vx *= 0.76;
    node.vy *= 0.76;
    const speed = Math.hypot(node.vx, node.vy);
    if (speed > 18) {
      node.vx = (node.vx / speed) * 18;
      node.vy = (node.vy / speed) * 18;
    }
    node.x += node.vx * opts.alpha;
    node.y += node.vy * opts.alpha;
  }
}
