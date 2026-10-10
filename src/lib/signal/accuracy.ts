import type { HardwareProfile } from "@/lib/signal/hardware";

export type AccuracyRow = { id: string; label: string; value: string };

export function accuracyRows(hw: HardwareProfile | null, demo: boolean): AccuracyRow[] {
  const age = hw?.probedAt ? `${Math.max(0, Math.round((Date.now() - hw.probedAt) / 1000))} s ago` : "no probe";
  const link = !hw
    ? "no probe"
    : hw.connection.supported
      ? `${hw.connection.effectiveType ?? "type unpublished"} · down ${hw.connection.downlink ?? "unpublished"} Mb/s · rtt ${hw.connection.rtt ?? "unpublished"} ms`
      : "API absent";
  return [
    { id: "secure", label: "Secure context", value: hw ? (hw.secure ? "yes" : "no — camera, mic, and sensors stay blocked") : "no probe" },
    { id: "probe", label: "Probe", value: age },
    { id: "demo", label: "Demo", value: demo ? "on — these rows are not a capture" : "off" },
    { id: "class", label: "Class", value: hw?.klass ?? "no probe" },
    { id: "cores", label: "Cores", value: hw ? String(hw.cores) : "no probe" },
    { id: "memory", label: "Memory", value: hw?.memoryGb == null ? "unpublished" : `~${hw.memoryGb} GB bucket, not exact` },
    { id: "model", label: "Model", value: hw?.model ?? "unpublished" },
    { id: "gpu", label: "GPU", value: hw?.gpu ?? "unpublished" },
    { id: "screen", label: "Screen", value: hw ? `${hw.screen.w}×${hw.screen.h} · dpr ${hw.screen.dpr}` : "no probe" },
    { id: "pointer", label: "Pointer", value: hw ? `${hw.pointer} · touch ${hw.touchPoints}` : "no probe" },
    { id: "online", label: "Online", value: hw ? String(hw.online) : "no probe" },
    { id: "link", label: "Link", value: link },
    { id: "bluetooth", label: "Bluetooth", value: hw?.bluetooth ?? "no probe" },
    { id: "media", label: "Devices", value: hw ? `${hw.media.audioInputs} in · ${hw.media.videoInputs} cam · ${hw.media.audioOutputs} out${hw.mediaUnlabeled ? " · labels hidden" : ""}` : "no probe" },
    { id: "camera", label: "Camera", value: hw?.media.camera ? "API present, not armed" : "API absent" },
    { id: "mic", label: "Microphone", value: hw?.media.mic ? "API present, not armed" : "API absent" },
    { id: "usb", label: "USB", value: hw?.buses.usb ? "API present, not a scan" : "API absent" },
    { id: "hid", label: "HID", value: hw?.buses.hid ? "API present" : "API absent" },
    { id: "serial", label: "Serial", value: hw?.buses.serial ? "API present" : "API absent" },
    { id: "midi", label: "MIDI", value: hw?.buses.midi ? "API present" : "API absent" },
    { id: "pad", label: "Gamepad", value: hw ? (hw.buses.gamepad ? String(hw.buses.gamepads) : "API absent") : "no probe" },
    { id: "motion", label: "Motion", value: hw?.sensors.accelerometer ? "constructor present, no reading yet" : "API absent" },
    { id: "battery", label: "Battery", value: hw?.battery ? `${Math.round(hw.battery.level * 100)}% · ${hw.battery.charging ? "charging" : "not charging"}` : "unpublished" },
    { id: "storage", label: "Storage", value: hw?.storage ? `${hw.storage.usageMb} / ${hw.storage.quotaMb} MB` : "unpublished" },
    { id: "zone", label: "Time zone", value: hw?.timeZone ?? "unpublished" },
  ];
}
