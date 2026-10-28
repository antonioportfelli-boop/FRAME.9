# Frame9 + Kratt™ — Wi-Fi Scan Insight Module
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