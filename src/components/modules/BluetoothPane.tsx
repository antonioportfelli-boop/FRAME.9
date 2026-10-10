import { useState } from "react";
import { requestBleDevice } from "@/lib/signal/hardware";
import { bleAttachFrame } from "@/lib/signal/frames";
import { useDesk } from "@/lib/signal/store";
import { Row } from "./Row";

export function BluetoothPane() {
  const hw = useDesk((s) => s.hardware);
  const metrics = useDesk((s) => s.metrics);
  const [busy, setBusy] = useState(false);
  const state = hw?.bluetooth ?? "missing";

  return (
    <div>
      <p className="px-3 py-3 text-sm text-pretty text-muted">
        Advertisement scans are not available here. Attach asks you to pick one device, then reads Battery Service only if that device offers it.
      </p>
      <dl>
        <Row k="API" v={state} />
        <Row k="Attached" v={metrics.bleName ?? "none"} />
        <Row k="Battery" v={metrics.bleBattery == null ? "n/a" : `${metrics.bleBattery}%`} />
      </dl>
      {metrics.bleError ? <p className="px-3 py-2 text-sm text-brass">{metrics.bleError}</p> : null}
      <div className="p-3">
        <button
          type="button"
          disabled={busy || state === "missing"}
          className="h-11 w-full border border-teal text-sm text-teal disabled:border-line disabled:text-muted"
          onClick={() => {
            setBusy(true);
            requestBleDevice()
              .then((device) => {
                const desk = useDesk.getState();
                const rel = (performance.now() - desk.sessionStart) / 1000;
                desk.pushFrame(bleAttachFrame(rel, device.name, device.battery));
                desk.setBle(device.name, device.battery, null);
              })
              .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : "Request failed";
                const cancelled = /cancel|not found|user/i.test(message);
                useDesk.getState().setBle(useDesk.getState().metrics.bleName, useDesk.getState().metrics.bleBattery, cancelled ? null : message);
              })
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Waiting…" : "Attach device"}
        </button>
      </div>
    </div>
  );
}
