# GitHub merge forensics · 2026-10-11
Status: PARTIAL (API inspection; no local clones of remote repositories).

## Repository A: antonioportfelli-boop/FRAME.9
- default branch `main` @ `30587d60bbae4d8278ffa5aee9a98f4673fb6d7d` (CI baseline via PR #3, 2026-10-11 01:55 UTC).
- active integration branch `Forge.-9` @ `2d225cc89a6df3ada6260c77bf2a2c9cc7458daa`. GitHub compare: ahead of main 20 commits, behind 0. **Do not present Forge.-9 features as merged into main.**
- PR #1 merged main 2026-10-10: source import and modular signal panes, merge SHA ecc76e3f79ff07cf3d10080d3475b6f345335e84.
- PR #3 merged main 2026-10-11: Node 22 CI, secret scan, merge SHA 30587d60bbae4d8278ffa5aee9a98f4673fb6d7d.
- PR #19 merged into Forge.-9 2026-10-11 09:08 UTC: Linux read-only host probe + 100-stage document, merge SHA 8963a6c539629cd372ec6a5fb3505de11894112e; paths include tools/host-probe, docs/FRAME9-HARDWARE-AWARENESS-100.md and host workflow; physical laptop verification NOT_RUN.
- PR #20 merged Forge.-9 09:06 UTC: RDAP TypeScript syntax repair, SHA 1ea5a9a0220d6bee11399d2757c5cadba5736bec.
- PR #6 merged Forge.-9 10:14 UTC: /login page, SHA 2d225cc89a6df3ada6260c77bf2a2c9cc7458daa; PR #5 Better Auth mount OPEN, meaning login page alone does not prove end-to-end login.
- PR #7 merged Forge.-9 09:52 UTC: Dependabot, SHA e7613506f796f34b8969ff14b044e40512eba291.
- PR #4 OPEN: prevents generic `npm run build` from applying DB migrations. Forge.-9 package.json still chains `npm run db:migrate` after build; deployment hazard P0/P1, no merge performed.
- Forge.-9 CI workflow run 38131260731 completed success for head `2d225cc...`, 2026-10-11. This is CI-level evidence, **not** device integration or production readiness.
- Other Forge.-9 merged PRs #8–#18 primarily SourcePane, RDAP, test harness, migration scope, exhaustive panes, Node docs, etc. Each individual patch and CI assertion needs its own PR evidence; do not equate merged with feature VERIFIED.

## Repository B: 3XTRINITY-CORPORATION/Frame.-9
- default branch `main` @ `c1aa6e27e4f0088af40915986e473805054e7e93`, 2026-10-11 09:10 UTC.
- PR #4 merged 08:12 UTC, SHA 85581696fa549b963bf1905d417e238800a549a1: restore Node boot/config/router and regression tests.
- PR #5 merged 09:05 UTC, SHA 0255139db178908cba8a0946322a1db8a5a0a4cb: control-center auth/GitHub/snapshot/audit vertical slice + Android Capacitor, RLS SQL; real hardware integration NOT_RUN.
- PR #6 merged 09:09 UTC, SHA 3c2defb85a282bb7537e2e4068fa9a391fd25668: protected /ai/* routes with token + limit + validation.
- **P0 regression**: PR #7 merged 09:10 UTC, SHA c1aa6e27e4f0088af40915986e473805054e7e93: reverted PR #6 security protections. Current src/server.js uses 10mb body parser; /ai routes are unprotected in current source. Do not expose this gateway to the internet or attach billable model credentials without repairing and retesting authorization.
- PR #8 OPEN: ai-engine-integration; this does not establish deployed capability.
- node-ci run 38127396852 and CodeQL 38127731075 success on c1aa6e27..., **but tests do not validate restored service token boundary**.

## GOLIATH cross-integration
- `tkynnap-creator/GOLIATH-OS`: default main; read-only connector permission; only README and .env.example found on main, no executable app confirmed.
- `3XTRINITY-CORPORATION-AND-SOFTWARE/GOLIATH-OS2`: GitHub repository metadata 404 under current credential: BLOCKED; may be wrong name or inaccessible.
- No authenticated FRAME.9 ↔ GOLIATH ↔ KRATT live API or permissioned device pair shown by this audit.

## P0 decisions
1. Re-establish fail-closed authentication on org Frame.-9 AI gateway using a new reviewed PR (do not auto-remerge the reverted PR without cause analysis).
2. Review / merge (with approval) personal FRAME.9 PR #4 before invoking generic build against live DB credentials.
3. PR #5 auth route + end-to-end login test before allowing private agent reports.
