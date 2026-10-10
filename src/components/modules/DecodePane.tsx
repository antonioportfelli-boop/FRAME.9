import { explainFrame } from "@/lib/signal/explain";
import { useDesk } from "@/lib/signal/store";
import { useSelectedFrame } from "./useSelectedFrame";

export function DecodePane() {
  const frame = useSelectedFrame();
  const field = useDesk((s) => s.field);
  const setField = useDesk((s) => s.setField);
  const selectFrame = useDesk((s) => s.selectFrame);
  if (!frame) return <p className="px-3 py-6 text-sm text-muted">Waiting for an observation.</p>;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <p className="font-mono text-xs text-muted">#{frame.no} {frame.proto}</p>
        <button type="button" className="h-11 px-3 font-mono text-xs text-teal" onClick={() => selectFrame(frame.no, null)}>
          Hold
        </button>
      </div>
      <p className="px-3 py-3 text-sm text-pretty text-muted">{explainFrame(frame)}</p>
      {frame.layers.map((layer) => (
        <section key={`${frame.no}-${layer.name}`}>
          <h3 className="border-b border-line bg-ink px-3 py-2 font-mono text-xs text-teal">{layer.name}</h3>
          <ul>
            {layer.fields.map((item) => {
              const on = field?.offset === item.offset && field.label === item.label;
              return (
                <li key={`${item.label}-${item.offset}`}>
                  <button
                    type="button"
                    className={`grid w-full grid-cols-2 items-baseline gap-3 px-3 py-2 text-left ${on ? "bg-raised" : ""}`}
                    onClick={() => setField(item)}
                  >
                    <span className="text-xs text-muted">{item.label}</span>
                    <span className="truncate text-right font-mono text-xs text-fg">{item.value}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
