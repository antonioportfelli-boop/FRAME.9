# FRAME.9 / Trinity module audit
**Audit date:** 2026-10-30  
**Branch:** `dev/frame9-audit-2026-10`  
**Scope:** static source review and GitHub Actions evidence. This is not a claim of complete browser, hardware, penetration, or production testing.

## Executive result

The repository contains two related surfaces: the FRAME.9 signal desk (18 panes) and the Trinity workspace (8 navigation areas), backed by shared signal, hardware, graph, auth, data, and API modules. The semantic prototype test and Gitleaks workflow have passed on recent commits. The full CI was not green at audit time; see the release gate below.

The product correctly documents several browser limits: a web page cannot capture arbitrary system traffic, act as an OS firewall, run WireGuard, or behave as a physical RF/DVB receiver. Radio and television panes distinguish microphone/camera/display inputs from unavailable RF hardware. Synthetic data is labeled separately from live host observations.

## Module-by-module review

| Module | Source / responsibility | Audit finding |
|---|---|---|
| Host | `HostPane`, `hardware.ts`, host-address API | Browser capability inventory and explicit permission flows. Geolocation, USB and hardware data remain browser/API-limited; not a full OS inventory. |
| Audit | `AuditPane`, `accuracy.ts` | Displays evidence quality and demo state; keep synthetic and inferred values visibly distinct. |
| Market | `MarketPane` | Comparison/education surface; its statements are product copy, not independently validated market research. |
| 9block | `BlockPane`, `block.ts` | Explicitly page-scoped fetch/sendBeacon filtering. It does not block other tabs, images, arbitrary scripts, or system traffic. The “Proovi reklaami” action makes an external Google ad-script request; it is a network probe, not proof of universal ad blocking. |
| Wire | `WirePane` | Generates/explains WireGuard configuration but does not create or activate a system tunnel. Its `/frame9-wire` companion is external/not implemented as a route in this repository. |
| Lookup | `LookupPane`, `rdap.ts`, `rdap-fetch.ts` | Uses public RDAP lookup. Validate upstream response handling, timeouts, and rate limits during runtime testing. |
| Source | `SourcePane`, `source.ts` | Repository/fork/archive links and clipboard action; depends on browser clipboard permission. |
| Post | `PostPane` | Local note/text helper; no connected mail or external publishing backend evidenced in this module. |
| Frames | `FramesPane`, `frames.ts` | Displays typed observations and source labels; distinguish live, registry, user-asserted and synthetic sources. |
| Decode | `DecodePane`, `frames.ts` | Decodes available frame-layer structures; not a general-purpose capture/packet decoder without actual capture input. |
| Hex | `HexPane` | Displays byte data when present; synthetic/demo bytes are explicitly labeled. |
| Wi-Fi | `WifiPane`, `hardware.ts` | Uses browser network information and measured link history; browser APIs do not expose nearby Wi-Fi scan results or raw packets. |
| Bluetooth | `BluetoothPane`, `hardware.ts` | User-selected Web Bluetooth device; reads Battery Service only if offered. No passive BLE advertisement scanner. |
| Radio | `RadioPane` | Microphone audio spectrum is not RF spectrum. USB RF is not connected to a driver. UI states this limit. |
| Television | `TelevisionPane` | Camera/display capture are not DVB/TV tuner reception. USB DVB remains unavailable without a driver. |
| Node | `NodePane`, `graph/world.ts` | Local graph selection/pinning and frame scoping; no evidence of a distributed node control plane. |
| Plates | `PlatesPane`, `plates.ts` | Local visual/plate workspace; verify persistence and import/export in browser QA. |
| Kit | `KitPane` | Local browser utilities (hash/base64/hex/device metadata); outputs are client-side helpers, not server verification. |
| Trinity Overview | `src/routes/trinity.tsx` | Current dashboard uses local illustrative fixtures/activity. Search filters local activity only. |
| Trinity Corpus Explorer | same | UI area exists; no connected canonical text corpus was verified. |
| Trinity Genealogy Graph | same | UI area exists; sample/fixture graph must not be presented as verified genealogy. |
| Trinity Interpretation Lab | same | Candidate/review presentation; no independent scholarly adjudication service verified. |
| Trinity Signal Lab | same | Synthetic signal visualization only; not clinical/biomedical measurement. |
| Trinity Kratt Commands | same | Dry-run/placeholder interaction only; no privileged execution integration. |
| Trinity Plugin Registry | same | Registry presentation; does not prove each external connector is authenticated or operational. |
| Trinity Audit & Settings | same | Local development/audit presentation; production policy controls still need server-side enforcement. |

## Shared platform modules

- **Routing/UI:** Tanstack Start/Router, React 19, Tailwind 4. Trinity route is registered; dock uses a native anchor to avoid the generated router search-type mismatch.
- **Signal store:** Zustand state, module windows, frames, scan sessions and metrics. Verify persistence lifecycle and stale-session handling with browser tests.
- **Hardware:** capability probing, user-gesture permission requests and measured host metadata. Browser APIs are partial and platform-dependent.
- **Graph:** local force-directed world and observation mapping; graph fixtures are not external network topology.
- **Auth:** Better Auth server route, generic OAuth broker plugin, bearer support for partitioned preview, sign-out and fail-closed user verification. OAuth client/server generic endpoints use narrow local type adapters because installed Better Auth 1.7.x no longer exports the former generic OAuth client helper.
- **Local account prototype:** `src/lib/signal/account.ts` stores accounts and sessions in localStorage/sessionStorage, uses a browser SHA-256 digest, exposes a fixed owner identity and computes an admin role from a client-controlled email/username. It also displays an email verification code locally because no mail server is connected. **This is not secure authentication and must never authorize server data or privileged actions.** The app's Better Auth path must remain the only authority for real identity and access control.
- **Database:** Postgres when `DATABASE_URL` exists; PGlite fallback otherwise. The auth schema is opt-in under `migrations/auth`; production migration is separate from build.
- **RDAP/host APIs:** explicit app routes. No RTC signaling route exists under `src/routes/api`, while `src/lib/multiplayer/p2p.ts` describes a `/api/rtc` relay contract. P2P is therefore a client library/contract, not an end-to-end enabled multiplayer feature in this repository.
- **PWA / workflows:** Vite PWA plugin, manifest/install middleware and CI workflows. Workflow definitions need continued review for permissions, action pinning, concurrency and secrets.

## Confirmed engineering findings

1. **High – local prototype account is not an identity/security boundary.** Client-side storage, SHA-256 password hashing and client-issued verification/admin role can be edited by the user. Keep it visibly demo-only or replace it with Better Auth-backed server sessions before relying on roles.
2. **Medium – multiplayer signaling is incomplete.** P2P client expects `/api/rtc`, but the repository API route inventory contains auth, host-address and RDAP only.
3. **Medium – several panes are explanatory or browser-only, not system-level tools.** This is correctly signposted in most UI copy; preserve those limitations in product descriptions.
4. **Medium – Trinity data layers are prototype fixtures.** No canonical corpus ingest, validated genealogy source pipeline, clinical signal source, or real Kratt execution adapter was verified.
5. **Medium – npm lockfile is inconsistent.** `npm install` succeeds, but `npm ci` still reports missing/incompatible nested entries (including `import-fresh`, `strip-json-comments`, and AJV graph entries). A lockfile rebuild job was added; its first attempt showed that `npm install --package-lock-only` did not repair the old dependency tree. The next attempt must remove the old lockfile before regeneration and then prove `npm ci`.
6. **Medium – integration test needs a real isolated database.** Previous test deliberately pointed `DATABASE_URL` at a closed port, causing Better Auth schema validation to return 500. CI was updated to start disposable PostgreSQL, apply the opt-in auth SQL for the test only, and then exercise the built route.

## CI and release gates

Required before merge/release:
- `npm ci` from committed lockfile;
- `npm run typecheck`;
- `npm run lint -- --max-warnings=0`;
- `npm test`;
- `npm run build` with no migration side effect;
- built auth-route integration test against disposable PostgreSQL;
- Gitleaks;
- browser smoke tests for desktop/mobile navigation, consent flows, Web Bluetooth denial/cancel, camera/microphone stop cleanup, and Trinity route;
- manual confirmation of any external broker credentials and integrations.

## Explicitly out of scope / not claimed

No production deployment, main-branch merge, live OAuth provider sign-in, physical RF/DVB/USB driver operation, OS-level firewall/VPN control, clinical use, or real-world genealogy verification was performed. No test result should be inferred from a source-only review.
