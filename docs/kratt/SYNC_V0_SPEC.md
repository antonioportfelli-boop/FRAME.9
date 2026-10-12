# KRATT local + cloud sync contract v0.1 (DESIGN ONLY)

Status: **PARTIAL design / NOT_RUN implementation**. No network synchronization, tenant authentication, SQLite adapter, cloud database, or deployment exists in this PR. Do not connect the local JSON prototype to the internet.

## Decision: smallest credible dual-runtime path

- **Local core:** Node 22 with a future SQLite adapter, offline queue and local inference. Current `tools/kratt-memory/ledger.mjs` is a single-process JSON integrity prototype, **not** a sync engine.
- **Cloud core:** same validation/event contracts, PostgreSQL transactional inbox/outbox, tenant-scoped RLS, authenticated API. These are **not implemented**.
- **AI routing:** policy-controlled local-first inference, explicit consent for cloud transmission; model outputs are proposals, never authority to deploy or erase.
- **Consistency:** eventual convergence after connectivity and successful authorized exchange; never claim strong consistency during a network partition.

## Event envelope (future v0.1; separate from legacy ledger event v1.0.0)

```ts
type SyncEnvelope = {
  sync_version: "0.1.0";
  tenant_id: string;
  event_id: string;            // unique within tenant
  origin_replica_id: string;
  origin_sequence: string;     // unsigned integer serialized as decimal string
  lamport: string;             // unsigned integer serialized as decimal string
  actor_id: string;
  occurred_at_utc: string;
  object_id: string;
  kind: "upsert" | "tombstone";
  payload_hash: string;        // SHA-256 of canonical payload or approved tombstone
  consent_reference: string;
  evidence_refs: string[];
};
```

Never treat an arbitrary `tenant_id` supplied by the client as proof of tenant membership. The server must derive authorized tenant scope from authenticated identity and compare it with every envelope. Client clocks and Lamport counters are ordering hints, not authorization or proof of physical time. Event hashes prove equality of bytes under the same canonicalization, **not** authenticity; use authenticated transport and signed provenance where required.

## Non-negotiable invariants

1. **Tenant isolation:** reject an event if its tenant differs from the authenticated request scope. Enforce the same rule with PostgreSQL RLS and tests.
2. **Idempotency:** unique key `(tenant_id, event_id)`; identical canonical hash is an ACK/no-op; a different hash is a collision and fails closed.
3. **Durability:** acknowledge receipt only after inbox, event and outbox changes commit atomically.
4. **No resurrection:** once an object has an accepted deletion/consent-revocation marker, a stale replica must not recreate its content. Minimize marker data and apply a documented retention/backup-erasure policy.
5. **Human decision gate:** divergent intent, access policy or deployment instructions create a review task, not automatic last-write-wins.
6. **Deterministic replay:** equivalent authorized event sets and policy versions produce the same materialized projection, regardless of arrival order; irreconcilable conflicts are explicit.
7. **Offline safety:** a local write can be locally durable but is **not** cloud-VERIFIED until the server commits and acknowledges it.
8. **Scoped export/erase:** active store, queues, replicas, exports and backups require separate deletion lifecycle checks. A JSON file erase alone is insufficient.

## Proposed receive algorithm (PSEUDOCODE, UNTESTED)

```text
authenticate request; derive actor_id and allowed tenant_ids
reject oversized batches and unknown schema versions
for each envelope:
    reject tenant_id not authorized for actor
    verify structural schema, payload hash, consent state, provenance
    if deletion marker already governs object_id:
        reject stale upsert; do not restore payload
    begin transaction (or one transaction for bounded batch):
        existing = inbox[(tenant_id, event_id)]
        if existing.hash == incoming.hash: ACK_DUPLICATE
        else if existing: REJECT_COLLISION
        else:
            insert inbox + validated event + outbox entry
    commit, then ACK
pull: authenticated tenant-scoped cursor, bounded pages, deterministic ordering
projection: review semantic conflicts; do not infer consent or permissions
```

The real implementation must address concurrent writes, cursor stability, retries, partial batch failures, backpressure, transaction isolation and replica identity. Do not use timestamp-only last-write-wins for sensitive records.

## Acceptance gates for the next PRs

| Gate | Required proof | Current status |
| --- | --- | --- |
| G0 local event integrity | `node --test tools/kratt-memory/ledger.test.mjs` on exact commit | CI pending after new tests |
| G1 shared schema | Runtime validation, canonical hash, tenant-scoped envelope tests | NOT_RUN |
| G2 offline replica | SQLite durable outbox, restart/replay and duplicate/collision tests | NOT_RUN |
| G3 cloud inbox | PostgreSQL migration, RLS deny-by-default and two-tenant isolation tests | NOT_RUN |
| G4 transport | Authenticated push/pull, pagination, retries, rate/body limits | NOT_RUN |
| G5 privacy | Consent revocation, stale-replica non-resurrection, backups and export tests | NOT_RUN |
| G6 convergence | Network partition/reorder/duplicate fault-injection tests | NOT_RUN |
| G7 agent controls | Explicit tool permissions, cloud opt-in, cost caps, no automatic merge/deploy | NOT_RUN |

## Important limits of current ledger

- A `VERIFIED` status currently checks that evidence references are **present and well-formed**, not that remote evidence was independently checked.
- `consent:...` is a **reference marker**, not proof of lawful consent or a valid access token.
- The local bank now validates its stored event hashes on read, but a malicious writer can replace both event and hash; SHA-256 alone is not a signature.
- No live database, cloud replica, production device or sync test has been run.
