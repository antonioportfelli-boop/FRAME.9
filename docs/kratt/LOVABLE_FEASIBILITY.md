# Lovable Cloud suitability: KRATT private alpha (2026-10-11)
Status: PARTIAL for documentation; actual project deployment BLOCKED.

Official source: https://docs.lovable.dev/features/cloud
The documentation describes a managed database, authentication, object storage, edge functions, jobs and usage metering. It describes Cloud region settings, export of Cloud data and a manual export/schema recreation path to external Supabase; no one-click Cloud-to-own-Supabase migration. Cloud backend separation and external storage adapter are therefore mandatory for KRATT.

Tenant-specific availability, fine-grained RLS policies, full-text export, backups and associated erasure, project privacy settings, credits and request quotas have NOT been empirically verified for KRATT. Do not mark them VERIFIED based only on vendor claims. Do not deploy until ownership, region, privacy, consent and monthly budget are approved.

Proposed first vertical slice: private authenticated event list, create idempotent synthetic event, evidence_refs, filtered query, consent revocation, per-owner deletion and JSON export. Server-side auth/RLS plus cross-tenant denial tests are required. Run no billable model calls.

Portable adapter contract (proposal):
put(event) -> { inserted, content_hash }
get(event_id, actor) -> scoped event or NOT_FOUND
list(actor, filters) -> scoped events
erase(event_id, actor) -> removal + evidence of backup policy
revokeConsent(consent_reference, actor) -> stop future ingest, purge affected scoped data
export(actor) -> JSON with provenance

Fallback: keep local Node prototype with synthetic public fixtures only until an approved cloud backend and data controller exist.
