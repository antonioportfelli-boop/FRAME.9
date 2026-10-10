# FRAME.9 threat model

FRAME.9 is a defensive observation tool for the device in front of you. It is not a monitor-mode sniffer, a cracking tool, or a hidden collector.

## In scope

- Facts the host API actually returns.
- Access-point and BLE metadata on Android, when a native collector is present and you grant the permission. This browser build does not have those collectors.
- This phone’s own traffic, only through an explicit VpnService the user prepares. Not implemented in the browser build.
- Public registry data you request (RDAP).
- User-asserted links, labeled as such.

## Out of scope — not implemented

- Wi-Fi deauthentication, packet injection, credential capture, password cracking, exploit scanning.
- TLS interception, custom certificate authorities, Authorization headers, cookies, passwords.
- Private radio content, access-control bypass, stealth persistence, permission bypass.
- Hidden background capture. Watch is a visible foreground session and stops when the page is hidden.
- Estimating distance from RSSI and calling it RTT.
- Turning a vendor id, RDAP registrant, or ASN into an “owner”.

## Trust boundaries

| Source | What it may support | What it must not support |
| --- | --- | --- |
| Browser host APIs | Inventory and link hints | A Wi-Fi scan or raw 802.11 |
| Web Bluetooth | One device you select | An advertisement survey |
| Microphone | Acoustic spectrum | An RF carrier or station |
| Camera / display | A picture meter | Identity of a router or a broadcaster |
| WebUSB | Authorized device ids | RF or DVB payloads without a driver |
| RDAP | Registrant / ASN metadata | Device ownership |
| Synthetic demo | Labeled fake frames | Anything shown as live |

## Browser build vs Android contract

The running product is this web desk. `android/collector` is a Kotlin boundary for a future app id `io.frame9.signaldesk`. It was not compiled here and it is not a claim that an APK exists.

## Residual risk

A person with access to this browser profile can read observations still held in memory and the exported JSON. Delete them when you are done. Registry lookups reveal the query to the RDAP operator.
