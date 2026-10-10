# Import verification — 2026-10-10

Source: complete-source handoff linked by the live FRAME.9 application; export timestamp 2026-10-08.

Changes:
- Split the 935-line modules/Panes.tsx into nine pane components, a shared Row, capability labels, and a selected-frame hook. Panes.tsx retains only routing.
- Removed the obsolete third argument to focusWindows; node selection no longer evaluates window.innerWidth unnecessarily.
- Narrowed the Web Crypto result to a key pair before exporting X25519 keys.
- Fixed lint errors and stabilized the permission refresh callback.
- Made Vite startup and test glob quoting work on Windows.
- Isolated test branding/auth fixtures; explicitly skipped four unavailable Grok documentation checks.
- Replaced stale source snapshot/download links with the selected FRAME.9 GitHub repository and handled clipboard failures.

Validation: typecheck and lint pass; 248 tests pass, four documentation tests skip. Production build passes. Browser checks cover initial render, host pane, demo observations, frame selection/decoding, and source links. No deployment or live external writes performed.

Known limitations: this is the exported snapshot, not necessarily the latest live site. Grok-specific account/connectors and optional local OS launchers need separate integration testing.
