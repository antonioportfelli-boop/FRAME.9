import { accuracyRows } from "@/lib/signal/accuracy";
import { probeHardware } from "@/lib/signal/hardware";
import { useDesk } from "@/lib/signal/store";

export function AuditPane() {
  const hw = useDesk((s) => s.hardware);
  const demo = useDesk((s) => s.demo);
  const rows = accuracyRows(hw, demo);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-3">
        <p className="text-xs text-muted">25 checks. A missing API stays missing.</p>
        <button
          type="button"
          className="h-11 shrink-0 border border-teal px-3 font-mono text-xs text-teal"
          onClick={() => {
            void probeHardware().then((next) => useDesk.getState().setHardware(next));
          }}
        >
          Probe
        </button>
      </div>
      <ul>
        {rows.map((row) => (
          <li key={row.id} className="border-b border-line px-3 py-2">
            <p className="font-mono text-xs text-teal">{row.label}</p>
            <p className="mt-1 text-xs text-muted">{row.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
