# FRAME.9 — 100 individual hardware requirement checks (2026-10-11)

Source: original `docs/FRAME9-HARDWARE-AWARENESS-100.md` on `Forge.-9` (blob `05c25c1e9f28168e69d62f63e73297caf462eec4`). Exact texts copied from checked source; G1–G10 gate definitions retained. All statuses are conservative source-based inventory, not proof of physical equipment.

Legend: PARTIAL = implementation/code/docs exist but not full acceptance; NOT_RUN = no item-specific execution evidence; BLOCKED = requires physical device or external auth/deploy unavailable; none VERIFIED at the full original requirement level. Evidence per step is summary classification only; further test run URL required for upgrade.

| Step | Original requirement | Current status | Evidence scope / missing proof |
| ---: | --- | --- | --- |
| 1 | Resolve current FRAME.9 Forge.-9 SHA before implementation. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 2 | Keep organization Frame.-9 as a separately audited repository. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 3 | Define Linux host agent vs hosted FRAME.9 frontend boundaries. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 4 | Define Android native code vs PWA/Termux boundaries. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 5 | Version snapshot schema, UTC timestamp and capability states. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 6 | Differentiate VERIFIED, UNAVAILABLE, UNSUPPORTED and UNAUTHORIZED. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 7 | Record supported Linux distributions and Python versions. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 8 | Inventory target laptop CPU architecture and kernel family. | NOT_RUN | Approval/threat/authority verification pending |
| 9 | Inventory target Android OS/API versions and hardware families. | NOT_RUN | Approval/threat/authority verification pending |
| 10 | G1: approve read-only hardware-context specification. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 11 | Threat-model local malicious web pages requesting the agent. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 12 | Threat-model remote connections, DNS rebinding and leaked tokens. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 13 | Inventory sensitive device identifiers before gathering data. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 14 | Exclude hostnames, serials, MACs and IPs by default. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 15 | Specify consent, retention, erasure and purpose limitation. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 16 | Require enrollment before transmitting anything to FRAME.9 Cloud. | NOT_RUN | Approval/threat/authority verification pending |
| 17 | Never ship default passwords, service-role keys or browser tokens. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 18 | Run host discovery without root or privileged capabilities. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 19 | Specify local token rotation and remote-device revocation. | NOT_RUN | Approval/threat/authority verification pending |
| 20 | G2: prove no unapproved collection or kernel writes. | PARTIAL | Source roadmap, consent/privacy boundaries; approval/security proof pending |
| 21 | Read Linux OS family and uname kernel release. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 22 | Read kernel-supported CPU architecture. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 23 | Read logical CPU count and label it accurately. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 24 | Read CPU model from permitted procfs keys. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 25 | Read RAM totals and available memory from procfs. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 26 | Read uptime and handle permission failures. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 27 | Parse Linux /etc/os-release without eval or shell. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 28 | Report procfs readability explicitly. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 29 | Report sysfs readability explicitly. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 30 | G3: produce a real versioned Linux JSON snapshot. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 31 | Read non-unique product model when permitted. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 32 | Exclude serial/board unique identifiers without explicit opt-in. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 33 | Separate VM/container visibility from physical hardware claims. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 34 | Detect GPU adapters via safe, narrow read-only APIs. | NOT_RUN | Hardware/platform/real host verification pending |
| 35 | Detect filesystem free space using statvfs only. | NOT_RUN | Hardware/platform/real host verification pending |
| 36 | Detect interfaces without exporting addresses or MAC by default. | NOT_RUN | Hardware/platform/real host verification pending |
| 37 | Detect optional battery/power state where readable. | NOT_RUN | Hardware/platform/real host verification pending |
| 38 | Add bounded CPU/memory utilization sampling. | NOT_RUN | Hardware/platform/real host verification pending |
| 39 | Capture data provenance and per-capability availability. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 40 | G4: test on distinct Linux hardware classes with null-on-unknown. | NOT_RUN | Hardware/platform/real host verification pending |
| 41 | Ship a dependency-free, one-shot JSON snapshot CLI. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 42 | Bind optional agent HTTP exclusively to 127.0.0.1. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 43 | Require an ephemeral cryptographically strong bearer token. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 44 | Reject Origin and untrusted Host headers with no wildcard CORS. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 45 | Implement authenticated health and snapshot routes. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 46 | Validate output schema and enforce payload limits. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 47 | Implement concurrency and resource limits. | NOT_RUN | Hardware/platform/real host verification pending |
| 48 | Package as opt-in local service after CLI validation. | NOT_RUN | Hardware/platform/real host verification pending |
| 49 | Redact logs and provide reliable stop/start controls. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 50 | G5: verify localhost permissions and rejected unauthorized requests. | PARTIAL | Linux host-probe Python implementation/fixture tests; acceptance incomplete |
| 51 | Choose APK/native bridge, PWA/TWA or Termux proof explicitly. | NOT_RUN | Android physical test and signed APK not proven |
| 52 | Respect Android application sandbox and Linux kernel restrictions. | NOT_RUN | Android physical test and signed APK not proven |
| 53 | Read Android hardware and OS facts through documented APIs. | NOT_RUN | Android physical test and signed APK not proven |
| 54 | Read permitted Android kernel version without attempting root. | NOT_RUN | Android physical test and signed APK not proven |
| 55 | Use native Android APIs for CPU/RAM/model where available. | NOT_RUN | Android physical test and signed APK not proven |
| 56 | Implement reviewed Capacitor/Kotlin bridge if actually required. | NOT_RUN | Android physical test and signed APK not proven |
| 57 | Request permissions only when necessary, in context. | NOT_RUN | Android physical test and signed APK not proven |
| 58 | Test Android 13–16 and vendor permission limits. | NOT_RUN | Android physical test and signed APK not proven |
| 59 | Generate and install a real Android debug APK. | BLOCKED | Android physical test and signed APK not proven |
| 60 | G6: compare physical device results to Android Settings. | BLOCKED | Android physical test and signed APK not proven |
| 61 | Generate per-device keypair in secure OS storage. | NOT_RUN | Secure key-backed pairing/revocation implementation evidence missing |
| 62 | Create short-lived user-initiated pairing challenge. | NOT_RUN | Secure key-backed pairing/revocation implementation evidence missing |
| 63 | Require user confirmation for each device enrollment. | NOT_RUN | Secure key-backed pairing/revocation implementation evidence missing |
| 64 | Use authenticated encrypted transport, preferably outbound only. | NOT_RUN | Secure key-backed pairing/revocation implementation evidence missing |
| 65 | Prevent pairing replay and cross-device impersonation. | NOT_RUN | Secure key-backed pairing/revocation implementation evidence missing |
| 66 | Enable key renewal, expiration and revocation. | NOT_RUN | Secure key-backed pairing/revocation implementation evidence missing |
| 67 | Track UNPAIRED, PENDING, VERIFIED, REVOKED and UNREACHABLE. | NOT_RUN | Secure key-backed pairing/revocation implementation evidence missing |
| 68 | Keep telemetry-read scopes distinct from device-control scopes. | NOT_RUN | Secure key-backed pairing/revocation implementation evidence missing |
| 69 | Respect user-chosen frequency, power and bandwidth budgets. | BLOCKED | Secure key-backed pairing/revocation implementation evidence missing |
| 70 | G7: prove only authorized users can access the right device. | BLOCKED | Secure key-backed pairing/revocation implementation evidence missing |
| 71 | Render Devices dashboard with source timestamp and status. | PARTIAL | Authenticated Devices/GOLIATH adapter and real paired laptop unproven |
| 72 | Enforce device permissions on backend using RBAC. | NOT_RUN | Authenticated Devices/GOLIATH adapter and real paired laptop unproven |
| 73 | Persist only explicitly consented and minimized telemetry. | NOT_RUN | Authenticated Devices/GOLIATH adapter and real paired laptop unproven |
| 74 | Bind agent version and Git SHA to verification evidence. | NOT_RUN | Authenticated Devices/GOLIATH adapter and real paired laptop unproven |
| 75 | Connect GOLIATH only via a verified authenticated API. | BLOCKED | Authenticated Devices/GOLIATH adapter and real paired laptop unproven |
| 76 | Distinguish read-only kernel context from OS admin capabilities. | NOT_RUN | Authenticated Devices/GOLIATH adapter and real paired laptop unproven |
| 77 | Offer diagnostics without silently mutating the operating system. | NOT_RUN | Authenticated Devices/GOLIATH adapter and real paired laptop unproven |
| 78 | Require explicit user approval for any OS change and rollback. | NOT_RUN | Authenticated Devices/GOLIATH adapter and real paired laptop unproven |
| 79 | Treat kernel modules as exceptional, separately reviewed software. | BLOCKED | Authenticated Devices/GOLIATH adapter and real paired laptop unproven |
| 80 | G8: prove a real laptop appears in FRAME.9 through secure pairing. | BLOCKED | Authenticated Devices/GOLIATH adapter and real paired laptop unproven |
| 81 | Fixture-test kernel, CPU, memory and OS-release parsers. | PARTIAL | Forge.-9 host CI and offline parser tests only |
| 82 | Integrate-test bearer auth, loopback, Origin and Host protection. | PARTIAL | Forge.-9 host CI and offline parser tests only |
| 83 | Test on the user's actual Linux laptop and sanitize snapshots. | NOT_RUN | Independent physical/security regression proof absent |
| 84 | Test under missing procfs/sysfs and container restrictions. | PARTIAL | Forge.-9 host CI and offline parser tests only |
| 85 | Test x86_64 and ARM64 hardware or documented fixtures. | PARTIAL | Forge.-9 host CI and offline parser tests only |
| 86 | Test Android permission-denied and lifecycle scenarios. | NOT_RUN | Independent physical/security regression proof absent |
| 87 | Test revoked pairing, stale sessions and malformed input. | NOT_RUN | Independent physical/security regression proof absent |
| 88 | Run GitHub Actions checks with least-privilege permissions. | PARTIAL | Forge.-9 host CI and offline parser tests only |
| 89 | Store SHA-linked offline test evidence and artifact hashes. | PARTIAL | Forge.-9 host CI and offline parser tests only |
| 90 | G9: verify integration tip after merging, not just PR branches. | PARTIAL | Forge.-9 host CI and offline parser tests only |
| 91 | Resolve any active hardcoded OAuth preview secrets. | NOT_RUN | Operational alpha, real session/device/rollback evidence absent |
| 92 | Separate normal app builds from production database migrations. | PARTIAL | Operational alpha, real session/device/rollback evidence absent |
| 93 | Verify real login/logout/session and server-side roles. | NOT_RUN | Operational alpha, real session/device/rollback evidence absent |
| 94 | Deploy authenticated backend under TLS and minimized scopes. | NOT_RUN | Operational alpha, real session/device/rollback evidence absent |
| 95 | Document reproducible Linux laptop installation. | NOT_RUN | Operational alpha, real session/device/rollback evidence absent |
| 96 | Build Android APK/AAB with signed artifacts and SHA-256 evidence. | BLOCKED | Operational alpha, real session/device/rollback evidence absent |
| 97 | Pair laptop and phone separately with user approval. | BLOCKED | Operational alpha, real session/device/rollback evidence absent |
| 98 | Verify refresh, disconnect, revocation and recovery. | BLOCKED | Operational alpha, real session/device/rollback evidence absent |
| 99 | Publish VERIFIED/PARTIAL/BLOCKED/NOT_RUN release matrix. | PARTIAL | Operational alpha, real session/device/rollback evidence absent |
| 100 | G10: prove both physical devices report truthful hardware context securely. | BLOCKED | Operational alpha, real session/device/rollback evidence absent |

No automatic promotion based on README, PR description or CI success. Verify each row against actual tests, then re-run G1–G10 as independent gates on the exact deployed SHA.
