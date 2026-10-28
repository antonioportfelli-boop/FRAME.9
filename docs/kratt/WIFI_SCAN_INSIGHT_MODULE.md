# Frame9 + Kratt™ — Wi-Fi Scan Insight Module
Version: 0.1.1 · Status: SPECIFICATION / NOT MERGED

## Purpose
Share one evidence-backed schema between Frame9 and Kratt™ for user-supplied Android Wi-Fi scan files. This module analyses imports; it does not reveal/recover passwords, bypass Wi-Fi security, or probe networks.

## Canonical schema contract
**Schema id:** `wifi-scan-snapshot/v1` (the existing Lovable implementation under `src/lib/platform/wifi-scan.ts` is the reference parser until a deliberate migration is reviewed).

Required top-level fields:
- `schema`: exact literal `wifi-scan-snapshot/v1`
- `source`: `android-dumpsys` | `json` | `csv`
- `capturedAt`: ISO-8601 timestamp or `null`
- `timestampKnown`: boolean; never infer unknown app timestamps as wall-clock time
- `redacted`: boolean
- `accessPoints`: normalized access point entries
- `warnings`: human-readable parser/provenance warnings
- `skippedRecords`, `droppedSecretFields`: non-negative counters

Each access point contains `ssid: string|null`, `hidden: boolean`, `bssid: string|null`, `frequencyMhz: number|null`, `band`, `channel: number|null`, `rssiDbm: number|null`, and normalized `security`. Unknown/missing fields remain null/unknown rather than fabricated. Input parsing must be bounded and robust against malformed/oversized files.

## Initial findings from supplied screenshots
- The scanner exposes SSID/BSSID, capability strings, RSSI in dBm, frequency in MHz, channel bandwidth and Wi-Fi standard.
- At least 16 entries are visible across 2.4 GHz and 5 GHz. Repeated TP-Link and MegaPint names have different BSSIDs/frequencies; this may mean separate radios/access points, but screenshots alone cannot prove that.
- Stronger visible examples: an unnamed entry at about -60 dBm / 2457 MHz; MegaPint-1Gb/s at -61 dBm / 2432 MHz; TP-Link_5CC1 at -63 dBm / 5240 MHz and another reading at -65 dBm / 2457 MHz.
- A signal reading alone cannot reliably establish distance. No ownership/location inference.
- Screenshot timestamps have unknown semantics unless the source format confirms the unit and epoch.
- Network names and MAC addresses are exposed; redact BSSIDs by default.

## UI sections
1. Overview: file name, scan time/provenance, record count, detected bands, strongest RSSI and confidence.
2. Network table: SSID/hidden status, masked BSSID, RSSI, frequency, band/channel, normalized security, source and warnings.
3. Filters: band, RSSI range, security and hidden SSID.
4. Compare: two snapshots, added/removed entries, signal deltas for matching entries.
5. Analysis: evidence vs interpretation vs unknown; weak signal and security observations with conservative wording.
6. File workspace: TXT/JSON/CSV imports; keep source, timestamp, parse status and warnings; controls to clear imports.
7. Reports: redacted JSON/CSV with schema id and provenance.
8. Privacy: local-first, no network transmission by default, no secrets in the result object, BSSID redaction on by default.

## Integration architecture
- **Frame9:** preserve `src/components/modules/WifiPane.tsx` as browser connection/link telemetry. It currently reports Network Information API downlink/RTT and explicitly says it is not an access point scan. Add a separate import/analysis route and adapter; never re-label browser link metrics as an AP scan.
- **Kratt™:** expose a pure read-only action named `analyze_wifi_scan_files` backed by the same schema and the existing `analyzeWifiScan(snapshot)` semantics. It returns analysis plus field-level source, warnings and redaction metadata. It must not execute tasks, probe networks or ingest credentials.
- **Browser:** imports only. Do not invent live scan results.
- **Android:** native `WifiManager` collector is a separate planned adapter. It must require user initiation, explicitly handle permission/disabled/throttled/unsupported/error states, and serialize to the schema above. Never silently add device permissions as part of web-only work.

## Android permission gate (not yet implemented)
The current native starter is not an AP scanner. Do not add permissions until the native collector is an approved task and the scaffold permission tests are updated. Before device tests, review current Android API-level requirements and explicitly check:
- Wi-Fi state/scan permission requirements for target SDK
- runtime permission flow on each supported API level, including Android 13+
- foreground/user action, disabled Wi-Fi and scan throttling
- error/permission-denied/unsupported states
- no background collection, root or monitor-mode paths
The collector must be labelled PLANNED until the APK has been built and the real permission flow has been device-tested.

## Privacy and file safety invariants
- Redact BSSID by default on import; report exports must always redact even if a caller explicitly imported unredacted data.
- Drop password/PSK/passphrase/secret/key-like fields and never render them; count dropped fields without echoing values.
- Unknown timestamps remain unknown; no inferred distance, owner or address.
- Do not execute imported content, fetch URLs from files, upload raw identifiers, or retain imported files beyond the current session without a clear user decision.
- Mark synthetic examples as demo, not live evidence.

## Test and release gates
- TXT/JSON/CSV parsing, including malformed/ragged rows and oversized inputs
- hidden SSID/nulls and duplicate records
- band/frequency/channel mapping and unknown bands
- timestamp units/epoch unknown handling
- password-like fields never persist into parser results, UI or exports
- BSSID always masked in JSON/CSV export
- comparison added/removed and RSSI delta correctness
- Frame9 link telemetry remains separate
- KRATT adapter is read-only and validates schema version
- native permission tests only alongside a real collector; otherwise test that no AP-scan permission is requested
- typecheck, lint, focused tests, full tests, production build and secret scan
- capture actual GitHub Actions/CI results before merge

## Current implementation evidence
The existing Lovable project already contains:
- `src/lib/platform/wifi-scan.ts` — schema v1, Android-dumpsys/JSON/CSV parser, analysis, filter, compare and redacted export
- `src/routes/wifi-analuus.tsx` — separate file import/filter/compare route
- `tests/platform/wifi-scan.test.ts` — parser/security/privacy tests, including hidden SSID filtering
- `docs/wifi-scan-snapshot-v1.md` — scope and Android collector gate

Last reported check evidence: TypeScript typecheck passed; targeted ESLint passed; Wi-Fi tests 9 passed; full `bun test tests` 230 passed / 0 failed across 21 files. Production build and a device-based Android permission check were not run. These results are from the Lovable workspace and do not establish that Frame9 itself builds or passes CI.

## Merge conditions
- Frame9 implementation and Kratt adapter reviewed against this contract.
- All relevant checks pass on the actual PR head and GitHub Actions evidence is available.
- No direct merge or deployment until required gates pass; no auto-merge.
