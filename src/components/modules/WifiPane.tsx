import { useEffect, useRef } from "react";
import { useDesk } from "@/lib/signal/store";
import { Row } from "./Row";

export function WifiPane() {
  const metrics = useDesk((s) => s.metrics);
  const supported = useDesk((s) => s.hardware?.connection.supported ?? false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const style = getComputedStyle(document.documentElement);
    const teal = style.getPropertyValue("--color-teal").trim() || "#3d9a8c";
    const brass = style.getPropertyValue("--color-brass").trim() || "#b89a6a";
    const line = style.getPropertyValue("--color-line").trim() || "#2a363c";
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = line;
    ctx.strokeRect(0.5, 0.5, rect.width - 1, rect.height - 1);
    const hist = metrics.linkHistory;
    if (hist.length < 2) return;
    const maxDown = Math.max(1, ...hist.map((item) => item.down ?? 0));
    const maxRtt = Math.max(1, ...hist.map((item) => item.rtt ?? 0));
    const plot = (key: "down" | "rtt", color: string, max: number) => {
      ctx.beginPath();
      hist.forEach((item, index) => {
        const value = key === "down" ? item.down ?? 0 : item.rtt ?? 0;
        const x = (index / (hist.length - 1)) * rect.width;
        const y = rect.height - (value / max) * (rect.height - 8) - 4;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    plot("down", teal, maxDown);
    plot("rtt", brass, maxRtt);
  }, [metrics.linkHistory]);

  return (
    <div>
      <p className="px-3 py-3 text-sm text-pretty text-muted">
        {supported
          ? "Downlink and round-trip time come from the Network Information API. Teal is megabits, brass is milliseconds. This is link telemetry, not a Wi-Fi scan and not a distance."
          : "This browser does not publish downlink or round-trip time. Online state is still live. No access points are listed because a page cannot scan them."}
      </p>
      <dl>
        <Row k="Online" v={metrics.online ? "yes" : "no"} />
        <Row k="Effective" v={metrics.effectiveType ?? "n/a"} />
        <Row k="Type" v={metrics.linkType ?? "n/a"} />
        <Row k="Downlink" v={metrics.downlink == null ? "n/a" : `${metrics.downlink} Mb/s`} />
        <Row k="RTT" v={metrics.rtt == null ? "n/a" : `${metrics.rtt} ms`} />
        <Row k="RTT ranging" v="unsupported — not estimated" />
        <Row k="Save-data" v={metrics.saveData ? "yes" : "no"} />
      </dl>
      <div className="px-3 pb-3">
        <canvas ref={canvasRef} className="h-24 w-full bg-ink" />
      </div>
      <p className="px-3 py-2 font-mono text-xs text-muted">Teal downlink · brass RTT</p>
    </div>
  );
}
