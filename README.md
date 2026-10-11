# FRAME.9

Signal desk built with React 19, TanStack Start, Vite and Tailwind CSS.

## Run locally

Use Node.js 22.12+ (verified with Node 24) and npm:

```sh
npm ci
npm run dev
```

Open http://localhost:8080. Authentication remains enabled by default. The exported `.env.example` documents optional configuration; do not commit credentials. Grok account/connector integrations require their original platform configuration and are not automatically available outside Grok.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The test command is compatible with Windows and Unix shells. Generic platform tests use isolated fixtures rather than the app's real branding or authentication configuration. Four documentation-contract tests explicitly skip when the excluded Grok internal skill documents are absent.

## Branches and CI

`main` is the stable base; development happens on `Forge.-9`. Open pull requests against `Forge.-9`. GitHub Actions (`.github/workflows/ci.yml`, Node 22 per `.nvmrc`) runs install, typecheck, lint (no warnings), test, build and a gitleaks secret scan for pull requests and pushes to `Forge.-9`.

## Structure

- `src/components/desk`: desktop shell and windows.
- `src/components/modules`: individual signal panels; `Panes.tsx` dispatches by module ID.
- `src/components/graph`: interactive graph rendering.
- `src/lib/signal`: observations, permissions, state and device adapters.
- `src/routes/api`: public lookup and host-address endpoints.
- `local` and `public/host`: optional host integration launchers; not required for the browser UI.

## Import provenance and limits

Imported from the complete-source download published at https://lunar-kite-nova-light.grok.me on 2026-10-10. The handoff identifies its export date as 2026-10-08. The current live site's toolbar differs from this exported snapshot, so this import does not claim to reproduce every later live-site change.

The import preserves the existing repository license. Original export archives and historical build reports are kept outside the repository; this repository contains the editable application.

Synthetic demo data is labeled. Browser device access requires the user's own permission. A webpage cannot run WireGuard or obtain operating-system privileges. Live Slack/Linear writes, account integration and physical device access were not exercised during this import.
