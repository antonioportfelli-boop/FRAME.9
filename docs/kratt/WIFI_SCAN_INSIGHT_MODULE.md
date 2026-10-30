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
Version: 0.1.0 · Status: PROPOSAL / NOT YET MERGED

## Purpose
Provide the same evidence-backed Wi-Fi scan-file analysis in Frame9 and Kratt™ with a compact mobile layout and a deeper desktop view. The module explains user-supplied Android Wi-Fi scan exports and screenshots; it must not reveal or recover passwords, bypass Wi-Fi security, or probe networks without authorization.

## Initial findings from supplied screenshots
- Scanner fields include SSID/BSSID, security capability strings, RSSI level in dBm, frequency in MHz, channel bandwidth and Wi-Fi standard.
- Screenshots show at least 16 visible entries across 2.4 GHz and 5 GHz; repeated TP-Link and MegaPint entries have different BSSIDs/frequencies. These may be separate radios or mesh/extender nodes, but the screenshots alone cannot prove that.
- Example stronger readings shown: one hidden-name BSSID is -60 dBm at 2457 MHz; MegaPint-1Gb/s is -61 dBm at 2432 MHz; TP-Link_5CC1 is -63 dBm at 5240 MHz or -65 dBm at 2457 MHz. Signal level alone is not a reliable distance estimate.
- Displayed timestamps should be treated as unknown units/epoch until the export schema confirms them.
- Screenshots expose network names and device MAC addresses. Redact BSSIDs by default in exports and never display passwords or credentials.

## UI sections
1. Overview: scan time, imported file, network count, 2.4/5/6 GHz distribution when determinable, strongest signals, confidence notes.
2. Networks table: SSID (hidden/blank marked), BSSID (masked by default), RSSI, band, frequency, channel if safely derived, bandwidth, standard, security, WPS flag, source and confidence.
3. Filters: band, signal interval, security type, WPS advertised, hidden SSID, vendor prefix (only with a trustworthy local/OUI source), duplicate SSID.
4. Compare: side-by-side scan files, RSSI changes, new/missing BSSIDs, channel overlap and security configuration deltas.
5. Analysis: likely congestion/overlap indicators, weak-signal guidance, outdated/insecure configuration warnings, explainers. Label each finding Evidence / Interpretation / Unknown; do not attribute router owner or location without evidence.
6. File browser: import screenshots, JSON, CSV, TXT or exported diagnostics; show source, date, parse status, warnings, delete/export controls.
7. Report: redacted HTML/JSON/CSV summary with source provenance and hash; raw identifiers included only after deliberate opt-in.
8. Controls: local-only default, retention choices, redact BSSIDs, remove names, clear imported files, stop analysis.

## Technical architecture
- Shared typed schema WifiScanSnapshot and normalizer live in a portable shared package.
- Android: native Kotlin WifiManager collector only, explicit permissions and user action; distinguish permission required, scan throttled, unsupported, no results and error. Never attempt root, monitor-mode capture or router login.
- Web: import/analyze only. Browser Network Information API is link telemetry, not an access-point scanner. Never fabricate live scan results.
- Parsing/analysis: bounded input sizes; tolerate malformed/partial lines; safe string rendering; do not execute imports; no automatic fetching of URLs embedded in files.
- Privacy: local-first, minimal retention, BSSIDs masked by default, no SSID/BSSID transmission by default, user-confirmed cloud sharing only.
- Evidence statuses: VERIFIED (source file or live API explicitly supplied), PARTIAL, UNKNOWN, UNSUPPORTED, PERMISSION_REQUIRED, ERROR. Synthetic/demo data must be visibly marked.
- Tests: screenshot-format variants; duplicate detection; null/hidden SSID; security-string parsing; band/frequency mapping; timestamp uncertainty; redaction; malformed/oversized files; Android permission-denied/throttled/disabled lifecycle; no false distance inference.

## Cross-system integration
- Frame9 module ID: wifi-insights, or extend the current wifi pane without changing the meaning of existing live-link telemetry.
- Kratt™ tool action: analyze_wifi_scan_files using the same schema and normalizer; return results plus field-level provenance, parse warnings and redaction metadata.
- Common output schema must be versioned and stable so Frame9, Kratt, reports and automation can consume it.
- Keep Android live scanning and web-file analysis as separate source classes; never blur imported scan evidence into a real-time scan.

## Acceptance criteria
- Supplied screenshots can be represented as imported, partial-evidence records without inventing missing fields.
- Signal ranking and band grouping are correct for parsed fields.
- BSSIDs are masked by default in reports.
- No password extraction, unauthorized probing or guessed distance is offered.
- Empty/unsupported/permission-denied/error states are explained in plain language.
- Desktop/mobile layouts share all core data and accessible controls.
- Parser unit tests, typecheck, lint, build and CI pass before merge.
- Android live collection is labelled VERIFIED only after an actual device test and recorded permission flow.
