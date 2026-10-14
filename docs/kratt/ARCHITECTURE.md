# KRATT memory architecture v1 (proposal)
Status: PARTIAL.

```
GitHub/CI events   FRAME.9 device signals  Architect feedback  Approved agent reports
      \                   |                   |                    /
       → ingestion adapter → validation → redaction/deny → provenance check
       → status/evidence gate → deduplication → classified event store
       → claim extraction (untrusted) → source linking → revisioned knowledge
       → search (exact first, semantic optional) → candidate improvement
       → independent mirror review → offline tests → proposal/approval → bounded execution
```

## Seven banks
- Event Ledger: scoped events, actors, SHA evidence; may be erased according to policy.
- Report Bank: bug analysis and agent report provenance.
- Knowledge Bank: concepts, claims, source artifacts, evidence and limits.
- Reflection Bank: predicted vs actual outcomes, causes and learning.
- Skill Registry: H01–H10 contracts, permissions, versions, evaluations, rollback.
- Architect Intent: confirmed choices separate from inferred suggestions; inspect/edit/delete.
- Evaluation Bank: benchmarks, regression snapshots and metrics.

## Roles / rights (not yet implemented)
Viewer: own approved records. Auditor: read redacted evidence without private secrets. Builder: proposal branch + tests only. Architect: approve intent, merges, release and deletion. Ingest service: scoped write-only with least privilege.
Default deny for unknown actors, collections, token scope, consent and visibility.

## Data store
PostgreSQL/Supabase-compatible schema is separately proposed in `SCHEMA_V1_PROPOSAL.sql`, not applied. All new tables must have RLS; no write policy is granted by default. Service credentials only on server side. Physical owner, tenant ID and consent gates should be added before any production migration. Export includes records, attachments, provenance and verified deletion proofs.

## Model decisions
1. Event records are not immutable if lawful erasure is requested.
2. Public metadata can use local JSON adapter for smoke testing only.
3. Build evidence means exact commit SHA and linked test run; labels alone do not qualify.
4. Semantic embeddings cannot change canonical facts; lexical and source-link search remain available.
5. No claims of self-awareness, retraining model weights or independent mandate.
