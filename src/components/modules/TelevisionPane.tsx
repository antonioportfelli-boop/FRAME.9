import { useEffect, useRef, useState } from "react";
import { rasterObsFrame } from "@/lib/signal/frames";
import { useDesk } from "@/lib/signal/store";
import { Row } from "./Row";

export function TelevisionPane({ active }: { active: boolean }) {
  const setRaster = useDesk((s) => s.setRaster);
  const raster = useDesk((s) => s.metrics.raster);
  const hw = useDesk((s) => s.hardware);
  const demo = useDesk((s) => s.demo);
  const [mode, setMode] = useState<"camera" | "display" | "usb" | "demo">("camera");
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if ((mode !== "camera" && mode !== "display") || !armed) return;
    let dead = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let lastPush = 0;
    const prev = new Float32Array(160 * 90);
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 160;
    sampleCanvas.height = 90;
    const onHide = () => {
      if (document.hidden) setArmed(false);
    };
    document.addEventListener("visibilitychange", onHide);
    const stopStream = () => {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
    const boot = async () => {
      try {
        stream =
          mode === "display"
            ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
            : await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (dead) {
          stopStream();
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        if (!dead) {
          setError(err instanceof Error ? err.message : "Picture blocked");
          setArmed(false);
        }
      }
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !activeRef.current || document.hidden || !video || video.readyState < 2) return;
      const g = canvas.getContext("2d");
      if (!g) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      if (canvas.width !== Math.floor(rect.width * dpr)) {
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor((rect.height || 112) * dpr));
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.drawImage(video, 0, 0, rect.width, rect.height);
      const sg = sampleCanvas.getContext("2d", { willReadFrequently: true });
      if (!sg) return;
      sg.drawImage(canvas, 0, 0, 160, 90);
      const img = sg.getImageData(0, 0, 160, 90);
      let luma = 0;
      let chroma = 0;
      let motion = 0;
      const count = 160 * 90;
      for (let i = 0; i < count; i += 1) {
        const o = i * 4;
        const y = 0.2126 * (img.data[o] ?? 0) + 0.7152 * (img.data[o + 1] ?? 0) + 0.0722 * (img.data[o + 2] ?? 0);
        luma += y;
        chroma += (img.data[o] ?? 0) - (img.data[o + 2] ?? 0);
        motion += Math.abs(y - (prev[i] ?? 0));
        prev[i] = y;
      }
      luma /= count;
      chroma /= count;
      motion /= count;
      const now = performance.now();
      if (now - lastPush > 2000) {
        lastPush = now;
        const desk = useDesk.getState();
        desk.setRaster({ luma, chroma, motion, mode });
        if (!desk.session || desk.demo) return;
        desk.pushFrame(rasterObsFrame((now - desk.session.startedAt) / 1000, { luma, chroma, motion, mode }));
      }
    };
    void boot();
    raf = requestAnimationFrame(loop);
    return () => {
      dead = true;
      document.removeEventListener("visibilitychange", onHide);
      cancelAnimationFrame(raf);
      stopStream();
    };
  }, [mode, armed]);

  useEffect(() => () => setRaster(null), [setRaster]);

  return (
    <div>
      <p className="px-3 py-3 text-sm text-pretty text-muted">
        Camera and display are picture meters. They do not identify a transmitter. USB DVB is not connected. Official broadcast dataset not loaded.
      </p>
      <div className="flex gap-2 px-3">
        <label className="sr-only" htmlFor="tv-mode">Picture source</label>
        <select
          id="tv-mode"
          value={mode}
          onChange={(event) => {
            setArmed(false);
            setError(null);
            setMode(event.target.value as "camera" | "display" | "usb" | "demo");
          }}
          className="h-11 flex-1 border border-line bg-ink px-2 text-sm text-fg"
        >
          <option value="camera" disabled={!hw?.media.camera}>Camera</option>
          <option value="display" disabled={!hw?.media.display}>Display</option>
          <option value="usb">USB DVB</option>
          <option value="demo">Demo</option>
        </select>
        {mode === "camera" || mode === "display" ? (
          <button type="button" className="h-11 flex-1 border border-teal text-sm text-teal" onClick={() => { setError(null); setArmed((v) => !v); }}>
            {armed ? "Stop" : "Arm"}
          </button>
        ) : null}
      </div>
      {mode === "usb" ? (
        <p className="px-3 py-3 text-sm text-brass">External DVB hardware required. No transport stream is generated.</p>
      ) : null}
      {mode === "demo" ? (
        <div className="px-3 py-3">
          <p className="text-sm text-brass">SYNTHETIC DEMO does not invent an MPEG-TS from this pane.</p>
          <button type="button" className="mt-2 h-11 w-full border border-brass text-sm text-brass" onClick={() => useDesk.getState().setDemo(!demo)}>
            {demo ? "Leave demo" : "Enable synthetic demo"}
          </button>
        </div>
      ) : null}
      {error ? <p className="px-3 py-2 text-sm text-brass">{error}</p> : null}
      {mode === "camera" || mode === "display" ? (
        <div className="px-3">
          <canvas ref={canvasRef} className="mt-3 h-28 w-full bg-ink" />
        </div>
      ) : null}
      <video ref={videoRef} className="hidden" playsInline muted />
      <dl className="mt-2">
        <Row k="Luma" v={raster ? raster.luma.toFixed(1) : "—"} />
        <Row k="Chroma R−B" v={raster ? raster.chroma.toFixed(1) : "—"} />
        <Row k="Motion" v={raster ? raster.motion.toFixed(2) : "—"} />
      </dl>
    </div>
  );
}
