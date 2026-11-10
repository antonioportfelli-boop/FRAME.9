# BERUVIAN NIGHT SKY — CSE-01 architecture

**Status:** Implemented contract draft on `feature/beruvian-night-sky-cse-01`. Runtime integration and astronomical-data ingestion are not implemented.

## Purpose

CSE-01 establishes the first versioned data contract for a source-backed celestial knowledge graph. It is limited to data shape and deterministic validation. It is not an astronomical ephemeris, coordinate transformation library, physics simulator, or source of scientific claims.

## Product boundaries

- **FRAME.9:** reusable CSE schema, validation and visualization adapters.
- **KRATT PRIME:** evidence, provenance, policy and reflection authority. CSE records may be proposed to KRATT; they do not self-authorize memory writes.
- **AURA:** separate visualization product. No AURA root application changes are included.
- **STEEL:** separate local-first runtime. No STEEL integration is included.

## Contract v0.1

- A graph snapshot has a dataset ID, revision, generation timestamp, entities and relations.
- Each entity and relation must carry at least one source reference.
- A source reference records provider, resource, revision, URI, retrieval timestamp and license identifier. Only HTTP(S) URIs are accepted.
- Evidence states remain explicit: `OBSERVED`, `DERIVED`, `INFERRED`, `SYNTHETIC`, `UNVERIFIED`.
- Positions declare a coordinate frame (`ICRS`, `GALACTIC`, `ECLIPTIC`, `LOCAL_HORIZON`) and epoch. The validator checks numeric bounds; it does not transform coordinates or certify scientific correctness.
- Cognitive axes A/B/C each take values 0, 1 or 2, producing 27 combinations. They are separate from astronomical coordinates, physical properties and measurement confidence.

## Explicit non-goals

- No live catalog/API ingestion.
- No claim that test fixtures represent real observations.
- No coordinate-frame conversion, orbital or cosmological simulation.
- No vector database, semantic retrieval or automatic learning.
- No KRATT semantic-memory writes or automatic approval.
- No cloud sync, authentication, multi-tenant isolation or production persistence.

## Next gates

1. Select and verify an astronomical source/catalog, schema, provenance fields, license and coordinate conventions.
2. Add a normalized import adapter that preserves source records and revisions.
3. Add tests against real catalog fixtures and coordinate reference cases.
4. Connect validated snapshots to FRAME.9's existing graph/visualization surfaces without replacing the current network graph.
5. Define a read-only KRATT evidence handoff; semantic-memory promotion remains approval-gated.

## Acceptance status

- Contract and validators: implemented in this feature branch.
- Unit tests: added; execution not yet verified.
- Astronomical data source: not selected.
- Visualization integration: not implemented.
- KRATT integration: not implemented.
- Production readiness: not claimed.

### Test invocation

After repairing the pre-existing `package.json` syntax issue on this feature branch, the focused test command is:

```sh
node --experimental-strip-types --test src/lib/cosmic/contracts.test.ts
```
