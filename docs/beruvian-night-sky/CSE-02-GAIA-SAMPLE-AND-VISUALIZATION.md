# BERUVIAN NIGHT SKY — CSE-02 Gaia sample and visualization

## Verified bounded sample

The committed CSV fixture contains 64 records retrieved from the official ESA Gaia TAP service on 2026-11-11. The ADQL query selects a deterministic bounded slice by `random_index`, restricts rows to five-parameter astrometric solutions, and caps the response at 64. The exact query, asynchronous TAP job ID, retrieval timestamp, endpoint, row count, and SHA-256 are in `src/lib/cosmic/fixtures/gaia-dr3-cse02-manifest.json`.

The query uses Gaia's `random_index` for a repeatable subset, then restricts it to five-parameter astrometric solutions and the first 64 matching rows. This small technical fixture is for importer and visualization work; it is not sized or designed for population inference. The integration preserves `source_id` as text, ICRS coordinates at Gaia's TCB reference epoch, uncertainty units, signed parallax, and proper-motion semantics. Negative parallaxes remain measurements; no reciprocal-distance conversion is performed.

## Import path

`importGaiaDr3Csv` parses the fixed CSV shape, rejects malformed and oversized samples, maps every row through the CSE-01 Gaia adapter, and validates the resulting graph snapshot. It has no network capability. Live acquisition remains a separate explicit step using the archived query in the manifest; a later network importer should retain query, release, retrieval time, row cap, response checksum, and attribution, and should hand the validated snapshot to the same pure mapper.

The existing CSE contract requires the three application-specific cognitive axes. This astronomy fixture assigns the neutral tuple `(1, 1, 1)` solely to satisfy that existing contract; it is not Gaia data, a scientific classification, a confidence score, or a physical property. The UI does not display those axes.

## FRAME.9 graph integration

The Desk now offers a separate **GAIA DR3** view beside the existing network view. The new sky plot reads only the validated local snapshot, maps ICRS RA/Dec to an equirectangular view, and exposes source IDs and source measurements. It adds no invented edges: Gaia source rows are plotted as separate observed astrometric sources. The existing network force graph and its simulation remain intact.

The graph is a display of coordinates at the catalogue epoch, not an epoch-propagation engine. Proper motion is retained for later work but is not animated. No AURA, STEEL, KRATT runtime, database, credential, or deployment integration is included.

## Provenance and attribution

- Archive: [Gaia ESA Archive](https://gea.esac.esa.int/archive/)
- Data model: [Gaia DR3 `gaia_source`](https://gea.esac.esa.int/archive/documentation/GDR3/Gaia_archive/chap_datamodel/sec_dm_main_source_catalogue/ssec_dm_gaia_source.html)
- Query service: [Gaia TAP service](https://gea.esac.esa.int/tap-server/tap/)
- Attribution: [Gaia DR3 credit and citation instructions](https://gea.esac.esa.int/archive/documentation/GDR3/Miscellaneous/sec_credit_and_citation_instructions/)
- Release overview: [Gaia Collaboration et al. 2023, A&A 674, A1](https://doi.org/10.1051/0004-6361/202243940)

The Gaia Archive describes `ref_epoch` as a Julian Year in TCB; `ra` and `dec` are ICRS at that epoch; `ra_error` and `pmra` use the alpha-star (`cos(dec)`) projection. The snapshot retains these meanings and units. The adapter's attribution marker is project-local and is not represented as an official SPDX license identifier.

## Remaining integration gates

1. Decide whether future acquisitions stay manually archived or gain an explicit user-triggered network action with caching and failure-state UI.
2. Define a scientifically suitable sky-distribution selection before using this fixture for any statistical analysis.
3. Add epoch propagation only with a reviewed astrometric model and tests against official reference cases.
4. Keep other Gaia data products, astrophysical classifications, and catalogue cross-matches separate and cited.
