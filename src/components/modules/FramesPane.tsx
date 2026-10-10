import { matchFrame } from "@/lib/signal/types";
import { useDesk } from "@/lib/signal/store";

export function FramesPane() {
  const frames = useDesk((s) => s.frames);
  const filter = useDesk((s) => s.filter);
  const setFilter = useDesk((s) => s.setFilter);
  const selected = useDesk((s) => s.selectedFrame);
  const selectFrame = useDesk((s) => s.selectFrame);
  const capture = useDesk((s) => s.capture);
  const setCapture = useDesk((s) => s.setCapture);
  const shown = frames.filter((frame) => matchFrame(frame, filter)).slice(0, 180);
  const chips = ["source:LIVE", "source:SYNTHETIC", "origin:host", "domain:link", "domain:radio", "domain:tv"];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-line p-3">
        <label className="sr-only" htmlFor="frame-filter">
          Display filter
        </label>
        <input
          id="frame-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="source:LIVE  domain:radio"
          className="h-11 w-full border border-line bg-ink px-3 font-mono text-xs text-fg outline-none placeholder:text-muted"
        />
        <div className="flex gap-2 overflow-x-auto">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              className={`h-11 shrink-0 border px-3 font-mono text-xs ${filter === chip ? "border-teal text-teal" : "border-line text-muted"}`}
              onClick={() => setFilter(filter === chip ? "" : chip)}
            >
              {chip}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" className="h-11 flex-1 border border-line text-sm text-fg" onClick={() => setCapture(!capture)}>
            {capture ? "Pause" : "Resume"}
          </button>
          <button type="button" className="h-11 flex-1 border border-line text-sm text-muted" onClick={() => useDesk.getState().wipeObservations()}>
            Delete
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {shown.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted">No observations. Start PULSE, SURVEY, or WATCH. Demo is separate and labeled synthetic.</p>
        ) : (
          shown.map((frame) => {
            const on = selected === frame.no;
            const badge = frame.source === "SYNTHETIC_DEMO" ? "DEMO" : frame.source.startsWith("OPEN_DATA") ? "REGISTRY" : frame.source === "USER_ASSERTED" ? "USER" : "LIVE";
            return (
              <button
                key={frame.no}
                type="button"
                onClick={() => selectFrame(frame.no)}
                className={`flex w-full flex-col gap-1 border-b border-line px-3 py-2 text-left ${on ? "bg-raised" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-teal">{frame.proto}</span>
                  <span className={`font-mono text-xs ${badge === "DEMO" || badge === "REGISTRY" ? "text-brass" : "text-teal"}`}>{badge}</span>
                  <span className="ml-auto font-mono text-xs tabular-nums text-muted">{frame.rel.toFixed(3)}</span>
                </span>
                <span className="truncate text-sm text-fg">{frame.info}</span>
                <span className="truncate font-mono text-xs text-muted">
                  {frame.src} → {frame.dst} · {frame.bytes ? `${frame.len} B` : "no raw bytes"} · {frame.source}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
