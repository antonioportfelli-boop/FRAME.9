# FRAME.9 hardware gates audit · 2026-10-11
Source: `docs/FRAME9-HARDWARE-AWARENESS-100.md` on antonioportfelli-boop/FRAME.9, branch Forge.-9, source blob 05c25c1e9f28168e69d62f63e73297caf462eec4.
Read original 100 numbered steps; status is based on source and GitHub CI, not a physical user device.

| Steps | Gate — exact original definition | Status | Evidence and gap |
| --- | --- | --- | --- |
| 1–10 | G1: approve read-only hardware-context specification. | PARTIAL | Versioned plan and host-probe exist; no explicit architect approval for final spec found. |
| 11–20 | G2: prove no unapproved collection or kernel writes. | PARTIAL | Host probe uses read-only procfs/sysfs, no outbound network; real host observability and consent review not performed. |
| 21–30 | G3: produce a real versioned Linux JSON snapshot. | PARTIAL | CLI renders schema_version=1 snapshot; fixtures tested; no physical laptop snapshot captured. |
| 31–40 | G4: test on distinct Linux hardware classes with null-on-unknown. | PARTIAL | Fixture missing-path handling exists; multi-class physical evidence not available. |
| 41–50 | G5: verify localhost permissions and rejected unauthorized requests. | PARTIAL | Loopback-only Python handler, token/Origin/Host tests; no real laptop runtime auth proof yet. |
| 51–60 | G6: compare physical device results to Android Settings. | BLOCKED | Android collector stub / separate control-center Capacitor project present; no installed debug APK or actual comparison. |
| 61–70 | G7: prove only authorized users can access the right device. | NOT_RUN | No observed keypair-backed pairing / revocation verification. |
| 71–80 | G8: prove a real laptop appears in FRAME.9 through secure pairing. | BLOCKED | Devices panel plus GOLIATH authenticated adapter missing verified physical evidence. |
| 81–90 | G9: verify integration tip after merging, not just PR branches. | PARTIAL | GitHub CI success 38131260731 at Forge.-9 head 2d225cc...; scope limited to automated checks. |
| 91–100 | G10: prove both physical devices report truthful hardware context securely. | BLOCKED | Two real devices, credentialed backend, pairing, revocation, signed artifacts not verified. |

## Coverage of all 100 requirements
The original document's steps 1–100 are preserved verbatim at the source. The rows above cover each step in its original group of ten. No individual step is silently marked VERIFIED. For full individual step-by-step acceptance, collect concrete execution logs, device fixture matrix, tested Linux distributions, CI artifact hashes, Android Settings side-by-side measurements, and GOLIATH API contract. Until then each gate remains non-VERIFIED.

## Next controlled physical check
On opted-in Linux laptop: `python3 tools/host-probe/frame9_host_probe.py snapshot` then compare OS/kernel/CPU/RAM locally without sharing serials/hostnames/MAC/IP. Cloud transmission and privileged access remain disabled.
