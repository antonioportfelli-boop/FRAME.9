import type { Frame } from "@/lib/signal/types";

export function explainFrame(frame: Frame): string {
  switch (frame.source) {
    case "SYNTHETIC_DEMO":
      return "Synthetic demonstration. These bytes were built in the browser. They are not a capture from this device.";
    case "LIVE_WEB_LINK":
      return "Link telemetry from the Network Information API. Not a Wi-Fi scan, not an 802.11 frame, and not a distance.";
    case "LIVE_HOST":
      return "Host facts this browser published. Missing values stay unpublished.";
    case "LIVE_AUDIO":
      return "Microphone spectrum. The peak is acoustic frequency in hertz, not a radio carrier.";
    case "LIVE_CAMERA":
      return frame.info.startsWith("display")
        ? "Display capture meter. Raw frames are not retained. A picture is not a transmitter."
        : "Camera meter. Raw frames are not retained. A visible object is not a network entity unless you assert that link.";
    case "LIVE_WEB_BLUETOOTH":
      return "A Bluetooth device you selected. Not a passive advertisement scan. Owner is unknown. Battery is read only if the device exposes it.";
    case "LIVE_USB":
      return "USB identifiers from a device you authorized. A vendor id is not an owner. No RF or DVB driver is loaded.";
    case "OPEN_DATA_RDAP":
      return "RDAP registry data. An address registrant is not the owner of a device, and an ASN operator is not the owner of your router.";
    case "OPEN_DATA_IANA":
      return "A registered or common service name. A port does not prove which application is running.";
    case "OPEN_DATA_TTJA":
      return "Broadcast registry slot. The official dataset is not loaded, so no broadcaster is named.";
    case "OPEN_DATA_VENDOR":
      return "Hardware vendor from a public prefix, if one was loaded. That is not the network owner.";
    case "USER_ASSERTED":
      return "You asserted this link. The camera did not identify the entity.";
    case "LIVE_ANDROID_WIFI":
      return "WifiManager scan result. Raw 802.11 bytes are not part of this source. A vendor prefix would be a hardware vendor, not the network owner.";
    case "LIVE_ANDROID_WIFI_RTT":
      return "Wi-Fi RTT measurement with its reported uncertainty. This is not an estimate from signal strength.";
    case "LIVE_ANDROID_BLE":
      return "BluetoothLeScanner metadata. Advertisement bytes are included only when the platform returned them.";
    case "LIVE_ANDROID_VPN":
      return "Traffic from this phone’s own VpnService. Payloads are not stored unless you save a capture.";
    case "LIVE_USB_RF":
      return "Samples from a connected RF adapter. None are produced unless a driver is actually loaded.";
    case "LIVE_USB_DVB":
      return "Transport stream from a connected DVB tuner. No service is invented when the tuner is absent.";
    default:
      return "Observation kept with its source. Claims do not go beyond that source.";
  }
}
