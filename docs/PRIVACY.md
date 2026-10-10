# FRAME.9 privacy

FRAME.9 is a local diagnostic desk. It observes this device only when you start a session or arm a sensor.

## What stays on the device

- Host facts the browser already publishes (cores, screen, battery if exposed, link hints).
- Observations you record during PULSE, SURVEY, or WATCH.
- A microphone spectrum or camera meter only while that module is armed.
- A Bluetooth device or USB device only after you pick it.
- Layout preferences in `localStorage` (`frame9.desk.v1`). Demo mode is not stored as on.

## What is not collected

- No account, no background scan, no upload by default.
- BSSID, MAC, location, packet payload, camera frames, and microphone recordings are not uploaded.
- Camera and display pixels are measured in memory and discarded. They are not written to the observation log as images.
- Live observations do not contain invented frame bytes. If a source has no raw bytes, the hex view says so.
- Synthetic demo bytes are labeled `SYNTHETIC_DEMO` and are omitted from session export.

## What leaves the device

Only when you ask:

- **Export** downloads `session.json` in your browser.
- **Registry lookup** sends the IP, domain, or ASN you typed to this app’s `/api/rdap` route, which queries the public RDAP service. The result is registry data, not proof of ownership.

Cloud sync is off.

## Stopping

Leaving the page or hiding it stops the session and releases the microphone and camera. Delete removes local observations from the desk.
