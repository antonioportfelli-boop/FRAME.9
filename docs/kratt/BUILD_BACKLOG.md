# KRATT build backlog & 30/60/90
Each phase requires evidence linked to exact SHA. Costs are planning estimates, not known Lovable invoices.

| Phase | Depends on | Deliverable + acceptance | Tests | Risk | Estimated incremental cost | State |
| --- | --- | --- | --- | --- | --- | --- |
| 0 Audit | repo reads | source forensics + exact branch/commit | API review | stale branches | €0 | PARTIAL |
| 1 Contracts | 0 | schema, local event gate + consent controls | Node unit tests | JSON concurrent writes | €0 local | PARTIAL |
| 2 Collection | 1 | GitHub webhook with signature verification, idempotent queue, scoped reports | spoof/replay fixtures | ingest abuse | €0–20/month | NOT_RUN |
| 3 Lovable Cloud | 1,2 | private instance + migration + RLS + export rehearsal | tenant isolation/deletion | data leakage, lock-in | usage dependent | BLOCKED |
| 4 Search/compression | 2,3 | lexical retrieval, source-anchored compression | golden factual fidelity | hallucinations | €0–50/month | NOT_RUN |
| 5 Skills | 4 | H01–H10 versioned handlers with policy gate | unit/golden/security | runaway tasks | usage dependent | NOT_RUN |
| 6 Books | 4 | 30 rights-safe citations/cards | bibliographic review | copyright | €0–30 | PARTIAL |
| 7 Mirror | 4,6 | architect-confirmed intents and feedback | erase/consent/false claims | identity profiling | €0–20 | NOT_RUN |
| 8 Bounded builder | 5,7 | draft PR only with signed mandate | offline replay | privilege abuse | usage dependent | NOT_RUN |
| 9 Integrations | 3,8 | auth API for FRAME.9/GOLIATH, device read-only | contract/RBAC | auth + device access | usage dependent | BLOCKED |
| 10 Ops | 1–9 | restore drill, RLS, load, alerts, controlled release | production-like staging | private data | budget approval | NOT_RUN |

## 30 days
P0 fix org /ai fail-open exposure, approve PR #4 migration separation and #5 auth route; produce complete repo snapshot and Node/CI proof, tenant-safe schema with canary RLS and deletion tests. Do not deploy KRATT memory with personal data.
## 60 days
Build signed read-only ingest with consent, revision history, retention job and export, install search/compression golden test set; implement 2 skills H01/H03 with peer review.
## 90 days
Deliver H01–H10 candidate registry, 30 licensed bibliographic cards, approved intent mirror, canary GOLIATH adapter and shadow deploy; physical devices only after signed pairing, RBAC and revocation demonstration.

Decisions needed: which project/workspace owns the Lovable database, who is data controller, maximum monthly cloud budget, retention schedule, what report sources have explicit consent, and whether org Frame.-9 service API should be private-only.
