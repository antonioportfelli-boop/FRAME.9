import { useEffect, useRef, useState } from "react";
import { radioObsFrame } from "@/lib/signal/frames";
import { useDesk } from "@/lib/signal/store";
import { Row } from "./Row";

export function RadioPane({ active }: { active: boolean }) {
  const setRadio = useDesk((s) => s.setRadio);
  const radio = useDesk((s) => s.metrics.radio);
  const mic = useDesk((s) => s.hardware?.media.mic ?? false);
  const demo = useDesk((s) => s.demo);
  const [source, setSource] = useState<"audio" | "usb" | "demo">("audio");
  const [armed, setArmed] = useState(false);
  const [fft, setFft] = useState<512 | 1024 | 2048>(1024);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!armed || source !== "audio") return;
    let dead = false;
    let raf = 0;
    let audio: { ctx: AudioContext; analyser: AnalyserNode; stream: MediaStream } | null = null;
    let bins: Uint8Array<ArrayBuffer> | null = null;
    let last = 0;
    const onHide = () => {
      if (document.hidden) setArmed(false);
    };
    document.addEventListener("visibilitychange", onHide);
    const boot = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        if (dead) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const ctx = new AudioContext();
        if (ctx.state === "suspended") await ctx.resume();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = fft;
        analyser.smoothingTimeConstant = 0.72;
        ctx.createMediaStreamSource(stream).connect(analyser);
        audio = { ctx, analyser, stream };
        bins = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (dead || document.hidden || !activeRef.current || !audio || !bins || !canvasRef.current) return;
          audio.analyser.getByteFrequencyData(bins);
          const canvas = canvasRef.current;
          const g = canvas.getContext("2d");
          if (!g) return;
          const rect = canvas.getBoundingClientRect();
          const dpr = Math.min(1.5, window.devicePixelRatio || 1);
          if (canvas.width !== Math.floor(rect.width * dpr)) {
            canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            canvas.height = Math.max(1, Math.floor(rect.height * dpr));
          }
          g.setTransform(dpr, 0, 0, dpr, 0, 0);
          g.fillStyle = "#0c1116";
          g.fillRect(0, 0, rect.width, rect.height);
          let peak = 0;
          let peakI = 0;
          let sum = 0;
          const step = Math.max(1, Math.floor(bins.length / 96));
          const barW = rect.width / Math.ceil(bins.length / step);
          g.fillStyle = "#3d9a8c";
          for (let i = 0; i < bins.length; i += step) {
            const value = bins[i] ?? 0;
            sum += value * value;
            if (value > peak) {
              peak = value;
              peakI = i;
            }
            const h = (value / 255) * rect.height;
            g.fillRect((i / step) * barW, rect.height - h, Math.max(1, barW - 1), h);
          }
          const rms = Math.sqrt(sum / bins.length) / 255;
          const peakHz = (peakI * audio.ctx.sampleRate) / audio.analyser.fftSize;
          const now = performance.now();
          if (now - last > 2000) {
            last = now;
            const desk = useDesk.getState();
            desk.setRadio({ peakHz, rms });
            if (!desk.session || desk.demo) return;
            desk.pushFrame(radioObsFrame((now - desk.session.startedAt) / 1000, peakHz, rms));
          }
        };
        loop();
      } catch (err) {
        if (!dead) {
          setError(err instanceof Error ? err.message : "Microphone blocked");
          setArmed(false);
        }
      }
    };
    void boot();
    return () => {
      dead = true;
      document.removeEventListener("visibilitychange", onHide);
      cancelAnimationFrame(raf);
      audio?.stream.getTracks().forEach((track) => track.stop());
      void audio?.ctx.close();
      setRadio(null);
    };
  }, [armed, fft, setRadio, source]);

  return (
    <div>
      <p className="px-3 py-3 text-sm text-pretty text-muted">
        Audio spectrum uses the microphone. It is not an RF receiver. USB RF stays disconnected until a driver exists. Demo does not draw a fake spectrum.
      </p>
      <div className="flex gap-2 px-3">
        <label className="sr-only" htmlFor="radio-source">Radio source</label>
        <select
          id="radio-source"
          value={source}
          onChange={(event) => {
            setArmed(false);
            setError(null);
            setSource(event.target.value as "audio" | "usb" | "demo");
          }}
          className="h-11 flex-1 border border-line bg-ink px-2 text-sm text-fg"
        >
          <option value="audio">Audio</option>
          <option value="usb">USB RF</option>
          <option value="demo">Demo</option>
        </select>
      </div>
      {source === "usb" ? (
        <p className="px-3 py-3 text-sm text-brass">External RF hardware required — driver unavailable. State: NOT_CONNECTED.</p>
      ) : null}
      {source === "demo" ? (
        <div className="px-3 py-3">
          <p className="text-sm text-brass">SYNTHETIC DEMO is not a measurement. No spectrum is drawn.</p>
          <button type="button" className="mt-2 h-11 w-full border border-brass text-sm text-brass" onClick={() => useDesk.getState().setDemo(!demo)}>
            {demo ? "Leave demo" : "Enable synthetic demo"}
          </button>
        </div>
      ) : null}
      {source === "audio" ? (
        <>
          <div className="mt-2 flex gap-2 px-3">
            <label className="sr-only" htmlFor="fft-size">FFT size</label>
            <select
              id="fft-size"
              value={fft}
              onChange={(event) => setFft(Number(event.target.value) as 512 | 1024 | 2048)}
              className="h-11 flex-1 border border-line bg-ink px-2 text-sm text-fg"
            >
              <option value={512}>FFT 512</option>
              <option value={1024}>FFT 1024</option>
              <option value={2048}>FFT 2048</option>
            </select>
            <button
              type="button"
              disabled={!mic}
              className="h-11 flex-1 border border-teal text-sm text-teal disabled:border-line disabled:text-muted"
              onClick={() => {
                setError(null);
                setArmed((value) => !value);
              }}
            >
              {armed ? "Disarm" : "Arm mic"}
            </button>
          </div>
          {error ? <p className="px-3 py-2 text-sm text-brass">{error}</p> : null}
          <p className="px-3 pt-2 text-xs text-muted">A row is written only while a session is running. Hiding the page stops the mic.</p>
          <div className="px-3">
            <canvas ref={canvasRef} className="mt-3 h-28 w-full bg-ink" />
          </div>
          <dl className="mt-2">
            <Row k="Peak" v={radio ? `${radio.peakHz.toFixed(0)} Hz acoustic` : "—"} />
            <Row k="RMS" v={radio ? radio.rms.toFixed(3) : "—"} />
          </dl>
        </>
      ) : null}
    </div>
  );
}
