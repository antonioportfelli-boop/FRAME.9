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
- Optional astrometry stores explicitly unit-labelled errors, parallax and proper-motion components, with the reference epoch and time scale retained.
- Cognitive axes A/B/C each take values 0, 1 or 2, producing 27 combinations. They are separate from astronomical coordinates, physical properties and measurement confidence.

## Initial astronomical source decision

**Initial star-catalogue source: ESA Gaia Data Release 3 (Gaia DR3), main table `gaiadr3.gaia_source`.** This is the selected first source for the star-field vertical slice, not the only future source for the sky.

- Gaia DR3 publishes ICRS right ascension and declination at each source's reference epoch, together with uncertainty fields, parallax and proper motion. The reference epoch is expressed as a Julian year in TCB.
- The CSE adapter must preserve the Gaia `source_id` as text (never a JavaScript floating-point number), map `ra`/`dec` to ICRS position, and preserve `ref_epoch`, `ra_error`, `dec_error`, `parallax`, `parallax_error`, `pmra` and `pmdec` with their original units.
- Gaia defines `ra_error` as uncertainty in alpha-star (alpha multiplied by cos(dec)) and `pmra` as mu-alpha-star; the adapter must retain those semantics rather than silently relabel them as unprojected RA values.
- Do not convert parallax directly into distance without a separately documented uncertainty-aware inference method. The source value and error remain the canonical imported measurements.
- Gaia data are open and free to use with credit to ESA/Gaia/DPAC. The app should preserve attribution and cite the Gaia mission and DR3 release papers in its data-source panel.
- First import should use a bounded, reproducible query/subset rather than attempting to download the entire catalogue. Galaxy/QSO candidates, solar-system objects, nebulae and cultural constellation boundaries require separately modelled sources or tables.

Official references:
- [Gaia ESA Archive](https://gea.esac.esa.int/archive/)
- [Gaia DR3 documentation](https://gea.esac.esa.int/archive/documentation/GDR3/)
- [Gaia DR3 main source catalogue data model](https://gea.esac.esa.int/archive/documentation/GDR3/Gaia_archive/chap_datamodel/sec_dm_main_source_catalogue/ssec_dm_gaia_source.html)
- [Gaia DR3 credit and citation instructions](https://gea.esac.esa.int/archive/documentation/GDR3/Miscellaneous/sec_credit_and_citation_instructions/)

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
- Initial star catalogue: Gaia DR3 selected; bounded importer and sample fixture not implemented.
- Visualization integration: not implemented.
- KRATT integration: not implemented.
- Production readiness: not claimed.

### Test invocation

After repairing the pre-existing `package.json` syntax issue on this feature branch, the focused test command is:

```sh
node --experimental-strip-types --test src/lib/cosmic/contracts.test.ts
```
