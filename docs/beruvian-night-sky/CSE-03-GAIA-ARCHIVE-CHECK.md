# BERUVIAN NIGHT SKY — CSE-03 Gaia archive check

## Decision

Gaia DR3 is a fixed public release. CSE-03 adds a user-triggered archive check, not background polling. The browser posts to a same-origin FRAME.9 endpoint; it cannot provide ADQL, table names, URLs, row caps, or arbitrary importer options. The server submits the archived fixed query, waits for the TAP job, bounds the response, imports and validates it, and returns the snapshot with provenance. No account, secret, database, or persistent user data is involved.

## Bounded query

The query is fixed in `src/lib/cosmic/gaia-dr3-query.ts` and selects at most 64 records from `gaiadr3.gaia_source`. It uses `random_index < 100000`, requires `astrometric_params_solved = 31` (five-parameter astrometry), and orders by `random_index`. Both ADQL `TOP 64` and TAP `MAXREC=64` cap the result. The returned CSV is limited to 48,000 characters; only exactly 64 rows with the expected columns are accepted. The CSE importer enforces coordinate, epoch, identifier, evidence-source, duplicate-ID, and graph-snapshot contracts before the server can publish a result.

The `random_index` filter is Gaia's mechanism for choosing repeatable subsets. This small demonstration sample remains unsuitable for population claims. Gaia DR3's `ref_epoch` is a Julian year in TCB; `ra` and `dec` are ICRS at that epoch, and `pmra` is the alpha-star projection. The importer preserves those meanings and does not infer distance or source class. See the [official Gaia DR3 data model](https://gea.esac.esa.int/archive/documentation/GDR3/Gaia_archive/chap_datamodel/sec_dm_main_source_catalogue/ssec_dm_gaia_source.html).

## Request, cache, and failure behavior

1. The graph's **CHECK GAIA ARCHIVE** button sends a same-origin JSON POST. The route rejects missing or cross-origin requests and ignores client-provided query data.
2. The server returns its validated cache for up to 24 hours per server process. After expiry, it creates a Gaia TAP async job, polls for at most 30 seconds, and best-effort cancels timed-out or failed jobs.
3. Outbound requests have eight-second timeouts, redirects are rejected, UWS text and CSV responses are size-capped, and a 15-second per-process request gap limits repeated archive checks.
4. Successful rows become a validated snapshot with the job ID, exact ADQL, retrieval time, response SHA-256, selection description, and attribution in a manifest.
5. Errors return stable codes and concise messages. The client keeps its current validated snapshot visible, displays the error, and does not replace the snapshot with partial or invalid data.

The cache is intentionally in-memory and per process; it is not shared across server instances and disappears on a cold start. The committed CSE-02 fixture remains the initial offline snapshot. A click after a live result may receive the server cache until its 24-hour expiry; the UI labels this clearly.

## Coordinate propagation boundary

The view continues to plot positions at the catalogue reference epoch. This phase does not animate proper motion. Gaia's astrometric source model is more involved than adding `pmra` and `pmdec` linearly: the full model is in ICRS/TCB and perspective acceleration depends on parallax, proper motion, and radial velocity. The committed sample does not ingest radial velocity or the full astrometric covariance. A future epoch-propagation phase must select and document a specific approximation, expose its valid epoch range and missing inputs, and compare outputs with official reference cases before display. See the [Gaia astrometric source model](https://gea.esac.esa.int/archive/documentation/GEDR3/Data_processing/chap_cu3ast/sec_cu3ast_cali/ssec_cu3ast_cali_source.html) and [Gaia DR3 perspective-acceleration notes](https://gea.esac.esa.int/archive/documentation/GDR3/Data_analysis/chap_cu4nss/sec_cu4nss_astrobin/ssec_cu4nss_astrobin_properties.html).

## Attribution

The UI credits ESA/Gaia/DPAC and the response manifest retains the Gaia release and retrieval provenance. Follow the [Gaia DR3 credit and citation instructions](https://gea.esac.esa.int/archive/documentation/GDR3/Miscellaneous/sec_credit_and_citation_instructions/). The project's `ESA-GAIA-OPEN-DATA-ATTRIBUTION` string remains a local provenance tag, not an SPDX license identifier.

## Scope

- No AURA, STEEL, KRATT runtime, production data store, or external credentials.
- No automatic refresh, background job, arbitrary-query API, unbounded catalogue download, or deployment.
- No proper-motion animation, distance estimate, classification, or invented Gaia relations.
- The CSE-02 snapshot and FRAME.9 network graph remain the fallback when Gaia Archive is unavailable.
