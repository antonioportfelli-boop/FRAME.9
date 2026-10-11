# KRATT BUILD CONTRACT v1.0
Status: PARTIAL · 2026-10-11 · owner approval required for deployment

## Boundaries
- FRAME.9 (personal repo) and Frame.-9 (organization repo) are **different codebases**; never silently merge histories or branch pointers.
- TÖEPÄRA validates provenance/evidence before KRATT proposes action.
- GPT-6 coordinates contracts; Copilot may implement tested PRs; Grok may independently challenge evidence. No shared agent memory is assumed.
- No unsupervised deploy, merges, live payments, network reconnaissance, device control or database migrations.
- Agent-generated explanations and books are untrusted data, not permissions, policy or verified facts.
- Human approves high-risk actions and can edit or erase confirmed intent records.

## Evidence states
VERIFIED requires an exact source reference + tested statement + current branch/commit or reproducible artifact.
PARTIAL means some executable components exist, but requirements incomplete.
BLOCKED means required external identity/physical device/access or authorization is missing.
NOT_RUN means no verification run for this claim.
FAILED means a check ran and failed.

## Event v1.0.0
Required: schema_version, event_id, timestamp_utc (ISO UTC), actor_id, actor_type, source_type, source_reference, repository, commit_sha, action, status, evidence_refs, consent_reference, visibility_scope, content_hash.
Local ingest computes SHA-256 over deterministic field ordering, accepts equivalent computed content_hash, enforces known status values, rejects plausible secrets before persistence, requires evidence_refs for VERIFIED, deduplicates event_id+hash, rejects ID collisions. Use NOT_APPLICABLE for events outside a commit. For public records consent_reference may be NOT_REQUIRED_PUBLIC; non-public records require specific consent identifier.

## Storage adapter boundary
V0: tools/kratt-memory/ledger.mjs; Node 22, JSON single-writer, local development only.
Not production ready: lacks inter-process locking, authentication, encryption at rest, database-level RLS, revocation propagation, transactional multi-record writes, backup/restore erasure, queueing, retention scheduler, append-only provenance revisions and external agents integration. Reject private/real agent reports until these are implemented.
The bank is *not* a service and must never be exposed as a public endpoint.

## Evaluation baseline
Run: `node --test tools/kratt-memory/ledger.test.mjs`.
Not part of existing npm test glob unless CI is extended. PR CI must run the targeted test explicitly.
Success for Phase 1 local slice: 3 isolated tests pass on Node 22, no network, no credentials, no DB mutation.
