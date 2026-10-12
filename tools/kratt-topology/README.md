# KRATT Antikythera–Solomon topology (experiment V0)

**Status: experimental diagnostic module, NOT a cryptographic transport.**

This Rust library implements the mathematical idea submitted for KRATT (orbital
skew, dual complementary values and a 250-node feedback matrix) while keeping
payloads and all security boundaries outside the experiment. It is designed
to be safe to review and run locally without secrets or network privileges.

## What works

- Stable Rust 2021, standard library only, `#![forbid(unsafe_code)]`.
- `alpha = t + offset*sin(t)`; `beta = -alpha`.
- 250 deterministic 64-bit nodes with cross-node feedback.
- A single `Mutex` protects an entire transition and consistent snapshot.
- Input validation for non-finite floats and invalid parameters.
- Thread-safe `OnceLock` global accessor.
- Deterministic replay, negative-input, full-update and concurrency unit tests.

## What this does NOT do

- No encryption, authentication, authorization, MAC, KDF or key generation.
- The 64-bit `diagnostic_tag` is **not** cryptographically secure or secret.
- The seed constants are mixing constants, **not mathematical primes**.
- Alpha + Beta = 0 by algebra; this **does not** hide packet sizes, timings,
  endpoints or network metadata, or establish traffic-analysis resistance.
- A 250-node state transition **does not** establish 250-bit security.
- No network listeners, raw sockets, covert tunnels, destructive actions,
  unattended self-modification, auto-merge, or deployment.
- Not tested on bare-metal, Android, iOS or macOS hardware.

The supplied prior prototype XORed a payload with a repeated 8-byte tag and
**returned that tag to the caller**. This leaks the would-be key and lacks
authenticated integrity. Never use that code for sensitive data. SHA-256 used
elsewhere in KRATT serves content integrity and identity, **not encryption**.
Real transport must use a reviewed protocol such as TLS 1.3 via rustls,
or a properly reviewed AEAD envelope with unique nonces, key management,
authentication, replay prevention and cross-platform security tests.

## Offline verification

```sh
cargo test --manifest-path tools/kratt-topology/Cargo.toml --all-targets --offline
cargo clippy --manifest-path tools/kratt-topology/Cargo.toml --all-targets --offline -- -D warnings
```

These commands run from the **FRAME.9 repository root**; they do not connect
to any cloud resource. A passing test establishes functional invariants only,
not cryptographic security or production readiness.

## Proposed KRATT bridge

Keep this module as opt-in, read-only telemetry behind a feature adapter.
Use the existing KRATT event contract and SHA-256 ledger for auditable
provenance; never serialize `diagnostic_tag` as a crypto key. Cloud/local
synchronization follows `docs/kratt/SYNC_V0_SPEC.md`, not these floating
point calculations. Cross-device bit-for-bit numerical equivalence requires
separate verified target tests (floating-point sin implementations can vary).
