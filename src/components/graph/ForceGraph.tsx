import { useEffect, useRef } from "react";
import { getWorld, step, unpinAll, type SimNode } from "@/lib/graph/world";
import { nodeMatches } from "@/lib/signal/types";
import { useDesk } from "@/lib/signal/store";

type Theme = {
  teal: string;
  teal2: string;
  brass: string;
  fg: string;
  muted: string;
  line: string;
  ink: string;
  bg: string;
  raised: string;
};

type Cam = { tx: number; ty: number; k: number };

function readTheme(): Theme {
  const style = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    teal: pick("--color-teal", "#3d9a8c"),
    teal2: pick("--color-teal-2", "#1d4a44"),
    brass: pick("--color-brass", "#b89a6a"),
    fg: pick("--color-fg", "#e7e2d4"),
    muted: pick("--color-muted", "#8b9691"),
    line: pick("--color-line", "#2a363c"),
    ink: pick("--color-ink", "#0c1116"),
    bg: pick("--color-bg", "#080b0e"),
    raised: pick("--color-raised", "#1a2329"),
  };
}

function hitNode(cam: Cam, x: number, y: number): SimNode | null {
  const world = getWorld();
  let best: SimNode | null = null;
  let bestD = 28;
  for (const node of world.nodes) {
    const sx = node.x * cam.k + cam.tx;
    const sy = node.y * cam.k + cam.ty;
    const d = Math.hypot(sx - x, sy - y);
    const rad = Math.max(20, node.r * cam.k + 8);
    if (d <= rad && d < bestD) {
      best = node;
      bestD = d;
    }
  }
  return best;
}

function fitNodes(cam: Cam, nodes: SimNode[], w: number, h: number) {
  if (!nodes.length || w < 10 || h < 10) return;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }
  const dx = Math.max(40, maxX - minX);
  const dy = Math.max(40, maxY - minY);
  const pad = { l: 36, r: 36, t: 196, b: 96 };
  const k = Math.min((w - pad.l - pad.r) / dx, (h - pad.t - pad.b) / dy, 1.8);
  cam.k = Math.max(0.35, k);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  cam.tx = (pad.l + w - pad.r) / 2 - cx * cam.k;
  cam.ty = (pad.t + h - pad.b) / 2 - cy * cam.k;
}

function traceShape(ctx: CanvasRenderingContext2D, node: SimNode, sx: number, sy: number, r: number) {
  ctx.beginPath();
  if (node.shape === "square") {
    const s = r * 1.55;
    ctx.rect(sx - s / 2, sy - s / 2, s, s);
  } else if (node.shape === "rect") {
    ctx.rect(sx - r * 1.15, sy - r * 0.72, r * 2.3, r * 1.44);
  } else if (node.shape === "tri") {
    ctx.moveTo(sx, sy - r);
    ctx.lineTo(sx + r * 0.96, sy + r * 0.78);
    ctx.lineTo(sx - r * 0.96, sy + r * 0.78);
    ctx.closePath();
  } else {
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
  }
}

function strokeBracket(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + dy);
  ctx.lineTo(x, y);
  ctx.lineTo(x + dx, y);
  ctx.stroke();
}

export function ForceGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cam = useRef<Cam>({ tx: 0, ty: 0, k: 1 });
  const sim = useRef({
    alpha: 1,
    holdId: null as string | null,
    needsFit: true,
    needsFocus: false,
    reduce: false,
    warmed: false,
  });
  const ui = useRef({
    search: "",
    frozen: false,
    selected: null as string | null,
    fa: null as string | null,
    fb: null as string | null,
    labels: true,
    charge: 140,
    link: 128,
  });
  const reheatToken = useDesk((s) => s.reheatToken);
  const fitToken = useDesk((s) => s.fitToken);
  const focusToken = useDesk((s) => s.focusToken);

  useEffect(() => {
    const pull = () => {
      const state = useDesk.getState();
      ui.current.search = state.search;
      ui.current.frozen = state.frozen;
      ui.current.selected = state.selectedNode;
      ui.current.labels = state.graph.labels;
      ui.current.charge = state.graph.charge;
      ui.current.link = state.graph.link;
      const frame =
        state.selectedFrame == null
          ? null
          : state.frames.find((item) => item.no === state.selectedFrame) ?? null;
      ui.current.fa = frame?.srcNode ?? null;
      ui.current.fb = frame?.dstNode ?? null;
    };
    pull();
    return useDesk.subscribe(pull);
  }, []);

  useEffect(() => {
    sim.current.alpha = 1;
    if (reheatToken > 0) unpinAll();
  }, [reheatToken]);

  useEffect(() => {
    sim.current.needsFit = true;
  }, [fitToken]);

  useEffect(() => {
    sim.current.needsFocus = true;
  }, [focusToken]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const theme = readTheme();
    sim.current.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = () => {
      const world = getWorld();
      const view = ui.current;
      const state = sim.current;
      if (!state.warmed && state.reduce) {
        for (let i = 0; i < 90; i += 1) {
          step(world, { charge: view.charge, link: view.link, alpha: 1, holdId: null });
        }
        state.alpha = 0;
        state.warmed = true;
        useDesk.getState().setFrozen(true);
      } else if (!view.frozen) {
        step(world, { charge: view.charge, link: view.link, alpha: state.alpha, holdId: state.holdId });
        if (state.alpha > 0.03) state.alpha *= 0.985;
        else state.alpha = 0;
      } else {
        step(world, { charge: view.charge, link: view.link, alpha: 0, holdId: state.holdId });
      }
      state.warmed = true;

      if (state.needsFit && width > 0) {
        fitNodes(cam.current, world.nodes, width, height);
        state.needsFit = false;
      }
      if (state.needsFocus && width > 0) {
        const q = view.search.trim();
        const matched = q ? world.nodes.filter((node) => nodeMatches(node, q)) : world.nodes;
        fitNodes(cam.current, matched.length ? matched : world.nodes, width, height);
        state.needsFocus = false;
      }

      ctx.clearRect(0, 0, width, height);

      const stepPx = 28 * cam.current.k;
      if (stepPx > 10) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = theme.line;
        const ox = ((cam.current.tx % stepPx) + stepPx) % stepPx;
        const oy = ((cam.current.ty % stepPx) + stepPx) % stepPx;
        for (let x = ox; x < width; x += stepPx) {
          for (let y = oy; y < height; y += stepPx) ctx.fillRect(x, y, 1, 1);
        }
        ctx.restore();
      }

      ctx.strokeStyle = theme.teal;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      const m = 14;
      const arm = 18;
      strokeBracket(ctx, m, m, arm, arm);
      strokeBracket(ctx, width - m, m, -arm, arm);
      strokeBracket(ctx, m, height - m, arm, -arm);
      strokeBracket(ctx, width - m, height - m, -arm, -arm);
      ctx.globalAlpha = 1;

      const q = view.search.trim();
      const { tx, ty, k } = cam.current;

      for (const edge of world.edges) {
        const a = world.byId.get(edge.source);
        const b = world.byId.get(edge.target);
        if (!a || !b) continue;
        const aHit = !q || nodeMatches(a, q);
        const bHit = !q || nodeMatches(b, q);
        const linked =
          (view.fa === a.id && view.fb === b.id) || (view.fa === b.id && view.fb === a.id);
        const selected = view.selected === a.id || view.selected === b.id;
        ctx.globalAlpha = !q || (aHit && bHit) ? 0.9 : 0.08;
        ctx.beginPath();
        ctx.moveTo(a.x * k + tx, a.y * k + ty);
        ctx.lineTo(b.x * k + tx, b.y * k + ty);
        ctx.lineWidth = linked || edge.heat > 0.4 ? 1.6 : 1;
        ctx.strokeStyle = linked ? theme.brass : edge.heat > 0.25 ? theme.teal : theme.line;
        ctx.stroke();
        const showLabel =
          view.labels &&
          (linked || edge.heat > 0.45 || (selected && k > 0.7) || (k > 1.15 && aHit && bHit));
        if (showLabel) {
          const mx = ((a.x + b.x) / 2) * k + tx;
          const my = ((a.y + b.y) / 2) * k + ty;
          ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
          const tw = ctx.measureText(edge.label).width;
          ctx.fillStyle = theme.ink;
          ctx.globalAlpha = !q || (aHit && bHit) ? 0.92 : 0.12;
          ctx.fillRect(mx - tw / 2 - 4, my - 8, tw + 8, 14);
          ctx.fillStyle = theme.fg;
          ctx.fillText(edge.label, mx - tw / 2, my + 3);
        }
      }

      for (const node of world.nodes) {
        const hit = !q || nodeMatches(node, q);
        const sx = node.x * k + tx;
        const sy = node.y * k + ty;
        const r = Math.max(8, node.r * Math.max(0.8, Math.min(1.4, k)));
        ctx.globalAlpha = hit ? 1 : 0.12;
        traceShape(ctx, node, sx, sy, r);
        ctx.fillStyle = node.id === "host" ? theme.teal2 : theme.raised;
        ctx.fill();
        const selected = view.selected === node.id;
        const framed = view.fa === node.id || view.fb === node.id;
        ctx.lineWidth = selected || node.pulse > 0.4 ? 2 : 1.25;
        ctx.strokeStyle = selected ? theme.teal : framed ? theme.brass : node.domain === "radio" ? theme.brass : node.domain === "tv" ? theme.fg : theme.teal;
        ctx.stroke();
        if (node.pinned) {
          ctx.fillStyle = theme.brass;
          ctx.fillRect(sx + r * 0.4, sy - r - 3, 4, 4);
        }
        const show =
          view.labels && hit && (k > 0.42 || selected || framed || node.pulse > 0.35 || node.id === "host");
        if (show) {
          ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillStyle = selected ? theme.fg : theme.muted;
          ctx.textAlign = "center";
          ctx.fillText(node.label, sx, sy + r + 14);
          ctx.textAlign = "left";
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const camNow = cam.current;
      const worldX = (x - camNow.tx) / camNow.k;
      const worldY = (y - camNow.ty) / camNow.k;
      const next = Math.min(2.8, Math.max(0.28, camNow.k * Math.exp(-event.deltaY * 0.0011)));
      camNow.k = next;
      camNow.tx = x - worldX * next;
      camNow.ty = y - worldY * next;
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    mode: "pan" | "node" | "pinch";
    id?: string;
    lx: number;
    ly: number;
    moved: boolean;
    pinch?: number;
    pinchK?: number;
  } | null>(null);

  function local(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const pos = local(event);
    pointers.current.set(event.pointerId, pos);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const a = pts[0];
      const b = pts[1];
      if (!a || !b) return;
      gesture.current = {
        mode: "pinch",
        lx: pos.x,
        ly: pos.y,
        moved: true,
        pinch: Math.hypot(a.x - b.x, a.y - b.y),
        pinchK: cam.current.k,
      };
      sim.current.holdId = null;
      return;
    }
    const node = hitNode(cam.current, pos.x, pos.y);
    if (node) {
      gesture.current = { mode: "node", id: node.id, lx: pos.x, ly: pos.y, moved: false };
      sim.current.holdId = node.id;
    } else {
      gesture.current = { mode: "pan", lx: pos.x, ly: pos.y, moved: false };
      sim.current.holdId = null;
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const pos = local(event);
    if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, pos);
    const g = gesture.current;
    if (!g) {
      const node = hitNode(cam.current, pos.x, pos.y);
      event.currentTarget.style.cursor = node ? "grab" : "move";
      return;
    }
    if (g.mode === "pinch" && pointers.current.size >= 2 && g.pinch && g.pinchK) {
      const pts = [...pointers.current.values()];
      const a = pts[0];
      const b = pts[1];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const worldX = (midX - cam.current.tx) / cam.current.k;
      const worldY = (midY - cam.current.ty) / cam.current.k;
      const next = Math.min(2.8, Math.max(0.28, g.pinchK * (dist / g.pinch)));
      cam.current.k = next;
      cam.current.tx = midX - worldX * next;
      cam.current.ty = midY - worldY * next;
      return;
    }
    const dx = pos.x - g.lx;
    const dy = pos.y - g.ly;
    if (Math.hypot(pos.x - g.lx, pos.y - g.ly) > 4) g.moved = true;
    if (g.mode === "pan") {
      cam.current.tx += dx;
      cam.current.ty += dy;
      g.lx = pos.x;
      g.ly = pos.y;
    } else if (g.mode === "node" && g.id) {
      const node = getWorld().byId.get(g.id);
      if (node) {
        node.x = (pos.x - cam.current.tx) / cam.current.k;
        node.y = (pos.y - cam.current.ty) / cam.current.k;
        node.vx = 0;
        node.vy = 0;
      }
      g.moved = true;
    }
  }

  function endPointer(event: React.PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    if (pointers.current.size === 0 && g) {
      if (!g.moved && g.mode === "node" && g.id) useDesk.getState().selectNode(g.id);
      else if (!g.moved && g.mode === "pan") useDesk.getState().selectNode(null);
      else if (g.moved && g.mode === "node" && !useDesk.getState().frozen) sim.current.alpha = Math.max(sim.current.alpha, 0.45);
      gesture.current = null;
      sim.current.holdId = null;
    } else if (pointers.current.size < 2 && g?.mode === "pinch") {
      gesture.current = null;
    }
  }

  function onDoubleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const node = hitNode(cam.current, event.clientX - rect.left, event.clientY - rect.top);
    if (!node) return;
    node.pinned = !node.pinned;
    useDesk.getState().bumpPin();
    useDesk.getState().selectNode(node.id);
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDoubleClick={onDoubleClick}
      aria-label="Force-directed signal fabric"
    />
  );
}
