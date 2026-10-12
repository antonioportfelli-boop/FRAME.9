# Agent handoff (2026-10-11)
Status PARTIAL. Canonical work tree: antonioportfelli-boop/FRAME.9 branch feature/kratt-build-protocol-v1, based on Forge.-9 SHA 2d225cc89a6df3ada6260c77bf2a2c9cc7458daa.

GPT-6: contract/spec/forensics and integration gate.
Copilot: implement lowest-risk isolated tests; no automatic merge.
Grok: independently verify code and evidence; submit counterexamples with exact refs.
No shared private transcripts or tokens; exchange sanitized Markdown/JSON in this folder.

Required report fields:
`agent_id, started_utc, finished_utc, repo, base_sha, proposed_sha, diff_paths, commands_run, actual_results, external_mutations, evidence_urls, open_risks, next_smallest_step`.
Never fill absent evidence with assumed outcomes. Human approval is required for high-risk actions.

First handoff:
1. Security owner: investigate why Frame.-9 org repo PR #6 was reverted by #7; prepare reviewed fail-closed auth restoration on isolated branch.
2. Builder: confirm Node 22 `node --test tools/kratt-memory/ledger.test.mjs` on exact PR HEAD; save CI run URL.
3. Data engineer: design tenant-aware SQL/RLS + consent revocation/retention tests before Lovable storage.
4. Auditor: confirm Forge.-9 PR #4 build/migration separation and #5 auth-route merge readiness.
