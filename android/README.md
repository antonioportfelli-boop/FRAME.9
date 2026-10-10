# FRAME.9 Android collector boundary

This directory is a contract for a future native collector. It is not a Gradle project, it was not compiled, and it is not an APK.

Intended application id, if a project is created later: `io.frame9.signaldesk`.

Minimum SDK, if the repo does not say otherwise: 28.

The web desk must not describe browser APIs as these Android collectors.

Collectors, when implemented against the real SDK, must:

- return `rawBytes = null` when the platform does not expose bytes
- refuse to invent 802.11, BLE advertisements, RTT distances, RF samples, or MPEG-TS
- ask for a permission only when that collector is started
- keep VpnService limited to this phone, with no TLS interception
- stop when the user stops the session
