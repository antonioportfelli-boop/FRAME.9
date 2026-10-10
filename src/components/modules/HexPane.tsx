import { useDesk } from "@/lib/signal/store";
import { useSelectedFrame } from "./useSelectedFrame";

export function HexPane() {
  const frame = useSelectedFrame();
  const width = useDesk((s) => s.hexWidth);
  const setHexWidth = useDesk((s) => s.setHexWidth);
  const field = useDesk((s) => s.field);
  if (!frame) return <p className="px-3 py-6 text-sm text-muted">No observation selected.</p>;
  if (!frame.bytes) {
    return (
      <p className="px-3 py-6 text-sm text-pretty text-muted">
        Structured observation — raw frame bytes are not exposed by this source ({frame.source}).
      </p>
    );
  }
  const bytes = frame.bytes;
  const rows: number[] = [];
  for (let i = 0; i < bytes.length; i += width) rows.push(i);
  return (
    <div>
      <div className="flex gap-2 border-b border-line p-3">
        <button type="button" className={`h-11 flex-1 border font-mono text-xs ${width === 8 ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => setHexWidth(8)}>
          8
        </button>
        <button type="button" className={`h-11 flex-1 border font-mono text-xs ${width === 16 ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => setHexWidth(16)}>
          16
        </button>
      </div>
      <div className="overflow-auto px-3 py-2 font-mono text-xs leading-6">
        {frame.source === "SYNTHETIC_DEMO" ? <p className="mb-2 text-brass">SYNTHETIC DEMO bytes — not a live capture.</p> : null}
        {rows.map((start) => {
          const slice = bytes.slice(start, start + width);
          const hex = Array.from(slice)
            .map((byte, index) => {
              const at = start + index;
              const marked = field && at >= field.offset && at < field.offset + field.length;
              const text = byte.toString(16).padStart(2, "0");
              return marked ? ` [${text}]` : ` ${text}`;
            })
            .join("");
          const ascii = Array.from(slice)
            .map((byte) => (byte >= 32 && byte < 127 ? String.fromCharCode(byte) : "."))
            .join("");
          return (
            <div key={start} className="flex gap-3 whitespace-pre text-fg">
              <span className="text-muted">{start.toString(16).padStart(4, "0")}</span>
              <span className="text-fg">{hex}</span>
              <span className="text-brass">{ascii}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
