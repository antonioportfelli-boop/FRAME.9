import type { CapState, ModuleId } from "@/lib/signal/types";

export type HostClass = "phone" | "tablet" | "desktop";

export type HardwareProfile = {
  klass: HostClass;
  cores: number;
  memoryGb: number | null;
  platform: string;
  model: string | null;
  architecture: string | null;
  bitness: string | null;
  brands: string;
  touchPoints: number;
  screen: { w: number; h: number; dpr: number; colorDepth: number };
  language: string;
  online: boolean;
  connection: {
    supported: boolean;
    effectiveType: string | null;
    type: string | null;
    downlink: number | null;
    rtt: number | null;
    saveData: boolean;
  };
  bluetooth: "available" | "unavailable" | "missing";
  media: {
    audioInputs: number;
    videoInputs: number;
    audioOutputs: number;
    mic: boolean;
    camera: boolean;
    display: boolean;
  };
  battery: { level: number; charging: boolean } | null;
  gpu: string | null;
  buses: {
    usb: boolean;
    hid: boolean;
    serial: boolean;
    midi: boolean;
    gamepad: boolean;
    gamepads: number;
  };
  sensors: {
    accelerometer: boolean;
    gyroscope: boolean;
    magnetometer: boolean;
    light: boolean;
  };
  pointer: "fine" | "coarse" | "none";
  storage: { usageMb: number; quotaMb: number } | null;
  benchPps: number;
  probedAt: number;
  secure: boolean;
  timeZone: string;
  mediaUnlabeled: boolean;
};

export type ModuleOrder = {
  id: ModuleId;
  state: "bound" | "partial" | "bench";
  detail: string;
};

type NetInfo = {
  effectiveType?: string;
  type?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

type NavExt = Navigator & {
  deviceMemory?: number;
  connection?: NetInfo;
  mozConnection?: NetInfo;
  webkitConnection?: NetInfo;
  userAgentData?: {
    mobile?: boolean;
    platform?: string;
    brands?: { brand: string; version: string }[];
    getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
  };
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
  bluetooth?: {
    getAvailability?: () => Promise<boolean>;
    requestDevice?: (opts: {
      acceptAllDevices?: boolean;
      optionalServices?: string[];
    }) => Promise<{
      id: string;
      name?: string;
      gatt?: {
        connect: () => Promise<{
          getPrimaryService: (name: string) => Promise<{
            getCharacteristic: (name: string) => Promise<{ readValue: () => Promise<DataView> }>;
          }>;
        }>;
      };
    }>;
  };
};

function connectionOf(nav: NavExt): NetInfo | null {
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

function classify(nav: NavExt): HostClass {
  const touch = nav.maxTouchPoints > 0;
  const shortSide = Math.min(window.screen.width, window.screen.height);
  const mobile = nav.userAgentData?.mobile ?? /Mobi|Android|iPhone|iPad/i.test(nav.userAgent);
  if (!mobile && !(touch && shortSide < 900)) return "desktop";
  if (shortSide >= 700) return "tablet";
  return "phone";
}

function gpuString(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return gl.getParameter(gl.RENDERER) as string;
    const value = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

export function readLink(nav: Navigator = navigator): HardwareProfile["connection"] & { online: boolean } {
  const ext = nav as NavExt;
  const info = connectionOf(ext);
  return {
    online: nav.onLine,
    supported: Boolean(info),
    effectiveType: info?.effectiveType ?? null,
    type: info?.type ?? null,
    downlink: typeof info?.downlink === "number" ? info.downlink : null,
    rtt: typeof info?.rtt === "number" ? info.rtt : null,
    saveData: Boolean(info?.saveData),
  };
}

export async function probeHardware(): Promise<HardwareProfile> {
  const nav = navigator as NavExt;
  const klass = classify(nav);
  const cores = nav.hardwareConcurrency || 1;
  const conn = readLink(nav);
  let model: string | null = null;
  let architecture: string | null = null;
  let bitness: string | null = null;
  if (nav.userAgentData?.getHighEntropyValues) {
    try {
      const high = await nav.userAgentData.getHighEntropyValues(["model", "architecture", "bitness", "platform"]);
      model = typeof high.model === "string" && high.model ? high.model : null;
      architecture = typeof high.architecture === "string" ? high.architecture : null;
      bitness = typeof high.bitness === "string" ? high.bitness : null;
    } catch {
      model = null;
    }
  }
  let bluetooth: HardwareProfile["bluetooth"] = nav.bluetooth ? "unavailable" : "missing";
  if (nav.bluetooth?.getAvailability) {
    try {
      bluetooth = (await nav.bluetooth.getAvailability()) ? "available" : "unavailable";
    } catch {
      bluetooth = nav.bluetooth ? "unavailable" : "missing";
    }
  }
  let audioInputs = 0;
  let videoInputs = 0;
  let audioOutputs = 0;
  let mediaUnlabeled = false;
  if (nav.mediaDevices?.enumerateDevices) {
    try {
      const devices = await nav.mediaDevices.enumerateDevices();
      for (const device of devices) {
        if (!device.label) mediaUnlabeled = true;
        if (device.kind === "audioinput") audioInputs += 1;
        else if (device.kind === "videoinput") videoInputs += 1;
        else if (device.kind === "audiooutput") audioOutputs += 1;
      }
    } catch {
      audioInputs = 0;
    }
  }
  let battery: HardwareProfile["battery"] = null;
  if (nav.getBattery) {
    try {
      const bat = await nav.getBattery();
      battery = { level: bat.level, charging: bat.charging };
    } catch {
      battery = null;
    }
  }
  const brands = nav.userAgentData?.brands?.map((b) => `${b.brand} ${b.version}`).join(", ") || nav.platform;
  const benchPps = klass === "phone" ? 4 : cores >= 8 ? 12 : 8;
  const navAny = nav as NavExt & {
    hid?: unknown;
    serial?: unknown;
    usb?: unknown;
    requestMIDIAccess?: unknown;
  };
  let gamepads = 0;
  if (typeof nav.getGamepads === "function") {
    for (const pad of nav.getGamepads()) if (pad) gamepads += 1;
  }
  let storage: HardwareProfile["storage"] = null;
  if (nav.storage?.estimate) {
    try {
      const estimate = await nav.storage.estimate();
      if (typeof estimate.usage === "number" && typeof estimate.quota === "number") {
        storage = { usageMb: Math.round(estimate.usage / 1048576), quotaMb: Math.round(estimate.quota / 1048576) };
      }
    } catch {
      storage = null;
    }
  }
  const sensorHost = window as Window & {
    Accelerometer?: unknown;
    Gyroscope?: unknown;
    Magnetometer?: unknown;
    AmbientLightSensor?: unknown;
  };
  const pointer = window.matchMedia("(pointer: fine)").matches
    ? "fine"
    : window.matchMedia("(pointer: coarse)").matches
      ? "coarse"
      : "none";
  return {
    klass,
    cores,
    memoryGb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    platform: nav.userAgentData?.platform || nav.platform || "unknown",
    model,
    architecture,
    bitness,
    brands,
    touchPoints: nav.maxTouchPoints,
    screen: {
      w: window.screen.width,
      h: window.screen.height,
      dpr: window.devicePixelRatio || 1,
      colorDepth: window.screen.colorDepth,
    },
    language: nav.language,
    online: conn.online,
    connection: {
      supported: conn.supported,
      effectiveType: conn.effectiveType,
      type: conn.type,
      downlink: conn.downlink,
      rtt: conn.rtt,
      saveData: conn.saveData,
    },
    bluetooth,
    media: {
      audioInputs,
      videoInputs,
      audioOutputs,
      mic: typeof nav.mediaDevices?.getUserMedia === "function",
      camera: typeof nav.mediaDevices?.getUserMedia === "function",
      display: typeof nav.mediaDevices?.getDisplayMedia === "function",
    },
    battery,
    gpu: gpuString(),
    buses: {
      usb: Boolean(navAny.usb),
      hid: Boolean(navAny.hid),
      serial: Boolean(navAny.serial),
      midi: typeof navAny.requestMIDIAccess === "function",
      gamepad: typeof nav.getGamepads === "function",
      gamepads,
    },
    sensors: {
      accelerometer: typeof sensorHost.Accelerometer === "function",
      gyroscope: typeof sensorHost.Gyroscope === "function",
      magnetometer: typeof sensorHost.Magnetometer === "function",
      light: typeof sensorHost.AmbientLightSensor === "function",
    },
    pointer,
    storage,
    benchPps,
    probedAt: Date.now(),
    secure: window.isSecureContext,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    mediaUnlabeled,
  };
}

export function moduleOrders(hw: HardwareProfile | null): ModuleOrder[] {
  if (!hw) {
    return [
      { id: "host", state: "partial", detail: "Probe in progress." },
      { id: "frames", state: "bench", detail: "Bench frames only until the probe returns." },
    ];
  }
  const link = hw.connection.supported
    ? "bound"
    : "partial";
  return [
    {
      id: "host",
      state: "bound",
      detail: `${hw.klass}, ${hw.cores} cores${hw.memoryGb ? `, ~${hw.memoryGb} GB` : ""}`,
    },
    {
      id: "wifi",
      state: link,
      detail: hw.connection.supported
        ? `Network Information API, ${hw.connection.effectiveType ?? "type unpublished"}`
        : "Online/offline only. This host does not publish downlink or RTT.",
    },
    {
      id: "bluetooth",
      state: hw.bluetooth === "available" ? "bound" : hw.bluetooth === "missing" ? "bench" : "partial",
      detail:
        hw.bluetooth === "available"
          ? "Web Bluetooth is present. Attach is user-granted, not an inquiry scan."
          : hw.bluetooth === "missing"
            ? "No Bluetooth API. A page cannot run an advertisement scan."
            : "Bluetooth API present but the radio is unavailable.",
    },
    {
      id: "radio",
      state: hw.media.mic ? "bound" : "bench",
      detail: hw.media.mic
        ? `${hw.media.audioInputs} audio input(s). Spectrum is acoustic, not tuned RF.`
        : "No microphone API.",
    },
    {
      id: "television",
      state: hw.media.camera || hw.media.display ? "bound" : "bench",
      detail: hw.media.display
        ? "Camera or display meter after you arm it. No tuner."
        : hw.media.camera
          ? "Camera meter after you arm it."
          : "No camera or display API.",
    },
    {
      id: "frames",
      state: "bound",
      detail: "Observations are listed only while a session is running. Synthetic frames require Demo.",
    },
    { id: "decode", state: "bound", detail: "Protocol tree for the selected frame." },
    { id: "hex", state: "bound", detail: "Byte pane. Field click marks the span." },
    { id: "node", state: "bound", detail: "Opens from a node on the fabric." },
  ];
}

export async function requestBleDevice(): Promise<{ name: string; battery: number | null }> {
  const nav = navigator as NavExt;
  if (!nav.bluetooth?.requestDevice) throw new Error("This host has no Web Bluetooth API.");
  const device = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: ["battery_service"],
  });
  let battery: number | null = null;
  try {
    const server = await device.gatt?.connect();
    const service = await server?.getPrimaryService("battery_service");
    const ch = await service?.getCharacteristic("battery_level");
    const view = await ch?.readValue();
    if (view) battery = view.getUint8(0);
  } catch {
    battery = null;
  }
  return { name: device.name || device.id || "unnamed", battery };
}

export type CapabilityRow = {
  id: string;
  label: string;
  state: CapState;
  detail: string;
};

export type UsbIdentity = {
  vendorId: number;
  productId: number;
  productName: string | null;
};

type UsbApi = {
  getDevices?: () => Promise<UsbIdentity[]>;
  requestDevice?: (opts: { filters: { vendorId?: number }[] }) => Promise<UsbIdentity>;
};

function usbApi(): UsbApi | null {
  const nav = navigator as Navigator & { usb?: UsbApi };
  return nav.usb ?? null;
}

export function capabilityMatrix(hw: HardwareProfile | null): CapabilityRow[] {
  const usb = usbApi();
  return [
    {
      id: "host",
      label: "Host",
      state: hw ? "READY" : "DISABLED",
      detail: hw
        ? `${hw.klass}, ${hw.cores} cores, ${hw.platform}. Only values this browser published.`
        : "Reading public host APIs.",
    },
    {
      id: "wifi-scan",
      label: "Wi-Fi scan",
      state: "UNSUPPORTED_HARDWARE",
      detail: "A page cannot call WifiManager. No access-point list exists here.",
    },
    {
      id: "wifi-rtt",
      label: "Wi-Fi RTT",
      state: "UNSUPPORTED_HARDWARE",
      detail: "No ranging API. Distance is not estimated from signal strength.",
    },
    {
      id: "link",
      label: "Link telemetry",
      state: !hw ? "DISABLED" : hw.connection.supported ? "READY" : "UNSUPPORTED_HARDWARE",
      detail: hw?.connection.supported
        ? "Network Information API. Not a scan and not a range."
        : "This browser does not publish downlink or round-trip time.",
    },
    {
      id: "ble-scan",
      label: "BLE advertisement scan",
      state: "UNSUPPORTED_HARDWARE",
      detail: "BluetoothLeScanner is not available to a page.",
    },
    {
      id: "ble-pick",
      label: "Bluetooth pick",
      state: !hw
        ? "DISABLED"
        : hw.bluetooth === "missing"
          ? "UNSUPPORTED_HARDWARE"
          : hw.bluetooth === "available"
            ? "USER_CONSENT_REQUIRED"
            : "NOT_CONNECTED",
      detail:
        hw?.bluetooth === "available"
          ? "Web Bluetooth asks you to choose one device. That is not a scan."
          : "Web Bluetooth is missing or the radio is unavailable.",
    },
    {
      id: "vpn",
      label: "Local IP traffic",
      state: "UNSUPPORTED_HARDWARE",
      detail: "VpnService is not available in a browser. Packet bytes are not visible.",
    },
    {
      id: "camera",
      label: "Camera",
      state: !hw ? "DISABLED" : hw.media.camera ? "USER_CONSENT_REQUIRED" : "UNSUPPORTED_HARDWARE",
      detail: "Picture meter only after you arm it. Frames are not stored.",
    },
    {
      id: "audio",
      label: "Microphone",
      state: !hw ? "DISABLED" : hw.media.mic ? "USER_CONSENT_REQUIRED" : "UNSUPPORTED_HARDWARE",
      detail: "Audio spectrum. Acoustic frequency is not a radio carrier.",
    },
    {
      id: "usb",
      label: "USB host",
      state: usb ? "USER_CONSENT_REQUIRED" : "UNSUPPORTED_HARDWARE",
      detail: usb
        ? "WebUSB lists a device you authorize. No RF or DVB driver is loaded."
        : "WebUSB is not available.",
    },
    {
      id: "hid",
      label: "HID",
      state: hw?.buses.hid ? "USER_CONSENT_REQUIRED" : "UNSUPPORTED_HARDWARE",
      detail: hw?.buses.hid ? "WebHID can open a device you pick. It is not a scan." : "WebHID is not in this browser.",
    },
    {
      id: "serial",
      label: "Serial",
      state: hw?.buses.serial ? "USER_CONSENT_REQUIRED" : "UNSUPPORTED_HARDWARE",
      detail: hw?.buses.serial ? "Web Serial opens one port you choose." : "Web Serial is not in this browser.",
    },
    {
      id: "midi",
      label: "MIDI",
      state: hw?.buses.midi ? "USER_CONSENT_REQUIRED" : "UNSUPPORTED_HARDWARE",
      detail: hw?.buses.midi ? "Web MIDI lists ports after you allow it." : "Web MIDI is not in this browser.",
    },
    {
      id: "gamepad",
      label: "Gamepad",
      state: !hw?.buses.gamepad ? "UNSUPPORTED_HARDWARE" : hw.buses.gamepads > 0 ? "READY" : "NOT_CONNECTED",
      detail: hw?.buses.gamepad ? `${hw.buses.gamepads} gamepad(s) connected.` : "No Gamepad API.",
    },
    {
      id: "motion",
      label: "Motion sensors",
      state: hw?.sensors.accelerometer || hw?.sensors.gyroscope ? "PERMISSION_REQUIRED" : "UNSUPPORTED_HARDWARE",
      detail: hw?.sensors.accelerometer
        ? "Generic Sensor API is present. A reading starts only when you arm it."
        : "No Accelerometer constructor. Many laptops have no motion sensor.",
    },
    {
      id: "hidden-rf",
      label: "Hidden signals",
      state: "UNSUPPORTED_HARDWARE",
      detail: "A page cannot inventory hidden SSIDs, private radio, or a TV transmitter. Nothing is inferred.",
    },
    {
      id: "rf",
      label: "External RF tuner",
      state: "NOT_CONNECTED",
      detail: "No SDR driver. Nothing is demodulated.",
    },
    {
      id: "dvb",
      label: "External DVB tuner",
      state: "NOT_CONNECTED",
      detail: "External DVB hardware required. Official broadcast dataset not loaded.",
    },
    {
      id: "enrich",
      label: "Registry lookup",
      state: hw && !hw.online ? "NOT_CONNECTED" : "READY",
      detail: "RDAP runs only when you ask. A registrant is not an owner.",
    },
    {
      id: "ttja",
      label: "TTJA broadcast",
      state: "NOT_CONNECTED",
      detail: "Official broadcast dataset not loaded.",
    },
    {
      id: "cloud",
      label: "Cloud sync",
      state: "DISABLED",
      detail: "Off. Nothing is uploaded.",
    },
  ];
}

export async function requestUsbDevice(): Promise<UsbIdentity> {
  const usb = usbApi();
  if (!usb?.requestDevice) throw new Error("WebUSB is not available in this browser.");
  const device = await usb.requestDevice({ filters: [] });
  return {
    vendorId: device.vendorId,
    productId: device.productId,
    productName: device.productName ?? null,
  };
}

export async function readMotionSample(): Promise<string> {
  const Host = window as Window & {
    Accelerometer?: new (opts: { frequency: number }) => {
      x?: number;
      y?: number;
      z?: number;
      start: () => void;
      stop: () => void;
      addEventListener: (type: string, fn: () => void) => void;
    };
  };
  if (!Host.Accelerometer) return "No Accelerometer API on this host. A desktop often has none.";
  const sensor = new Host.Accelerometer({ frequency: 10 });
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      sensor.stop();
      resolve("No sample. The sensor is missing or permission was refused.");
    }, 2500);
    sensor.addEventListener("reading", () => {
      window.clearTimeout(timer);
      const text = `x ${sensor.x?.toFixed(2) ?? "—"}  y ${sensor.y?.toFixed(2) ?? "—"}  z ${sensor.z?.toFixed(2) ?? "—"}`;
      sensor.stop();
      resolve(text);
    });
    sensor.addEventListener("error", () => {
      window.clearTimeout(timer);
      sensor.stop();
      resolve("Sensor error. No value was invented.");
    });
    try {
      sensor.start();
    } catch (error) {
      window.clearTimeout(timer);
      resolve(error instanceof Error ? error.message : "Sensor did not start.");
    }
  });
}
