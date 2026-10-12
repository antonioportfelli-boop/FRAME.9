# Grok handoff — KRATT Antikythera/Topology (4-hour bounded sprint)

Baseline: stacked Rust topology branch `feature/kratt-antikythera-topology-v0`
from draft PR #21 at `4ebe2b8a808883418cd9e846e9550e222a6af281`.
This branch contains a **non-cryptographic** model, not an operating secure tunnel.
Use fresh exact SHAs and review existing work before editing.

## 00:00–00:30 — Technical reality and security audit
- Read the original user-supplied Rust design and the new crate README.
- Demonstrate repeated XOR key and exposed 64-bit diagnostic value defects,
  absent authentication, nonce, KDF, replay defense and traffic padding.
- Record the actual `cargo test`, `cargo clippy`, and CI outcomes. Do not
  claim verified targets without build/run evidence.

## 00:30–01:25 — Formalize and test the topology layer
- Preserve `alpha=t+e*sin(t)`, `beta=-alpha`, the 250-node state transition
  and safe mutex snapshots.
- Add only deterministic property tests / bounded proptest-like cases, but
  do not imply statistical unpredictability or proven cryptographic security.
- Add a meaningful bound to any loop; no arbitrary 500 million cycle claim.

## 01:25–02:30 — Design a genuinely secure transport adapter
- Separate topology observability from packet contents, keys and sessions.
- Research and propose standard TLS 1.3 (`rustls`) or vetted AEAD
  (`chacha20poly1305`, unique nonce under each key).
- Include identity/authentication, replay prevention, secret handling,
  protocol versioning, threat model and key rotation.
- Dependencies are appropriate when needed for safe cryptography. If the user
  insists on zero external dependencies, mark transport BLOCKED; do not
  invent a new cipher in core/std and call it production grade.

## 02:30–03:30 — Integration contracts and CI gates
- Specify a narrow adapter usable by local FRAME.9 / KRATT and cloud backend.
- Never change existing SHA-256 event identity semantics.
- Add cross-platform *compilation* matrix with clearly reported results:
  Linux x86_64, macOS arm64 (runner availability permitting), and a separate
  no_std feasibility issue for embedded targets. No false hardware claims.
- Include no secrets, no live money, and no external scanning.

## 03:30–04:00 — Evidence and handoff
- Produce exact commit SHAs, workflow/job URLs, passed/failed/skipped tests,
  known vulnerabilities, and next minimal PR.
- Create review-only branches/PRs when authorized. Never merge, deploy or
  update production databases autonomously.
- Report statuses VERIFIED / PARTIAL / BLOCKED / NOT_RUN / FAILED.

Stop immediately if the agent finds itself about to deploy a bespoke XOR
cipher, publish an unauthenticated socket, disable a security check, or
represent predictable diagnostic state as cryptographically secret.
