# FRAME.9 CI integrity repair

## Scope
This change repairs the dedicated KRATT Rust topology workflow only. It does not change application source, database migrations, deployment workflows, or the default branch.

## Defects addressed
- Removed duplicate `uses:` declarations from one checkout step. The prior YAML had two `uses` keys in a single mapping, which is invalid/ambiguous.
- Removed the duplicate checkout action.
- Added explicit Rust stable toolchain installation with the Clippy component, so Cargo commands do not depend on the runner image having a preinstalled toolchain.
- Removed `--offline` from Cargo test and Clippy. The workflow had no explicit dependency-cache setup, so an ephemeral runner could fail before compilation because dependencies were not cached.
- Expanded push triggers to `main`, `Forge.-9`, and `feature/**`; pull-request path filters remain scoped to topology code and this workflow.
- Added concurrency cancellation and retained least-privilege `contents: read`.

## Validation boundary
This commit changes a workflow definition. It has not yet been executed by GitHub Actions. A green run is required before treating the repair as verified. Application CI remains separately defined in `.github/workflows/ci.yml`.

## Expected commands
- `cargo test --manifest-path tools/kratt-topology/Cargo.toml --all-targets`
- `cargo clippy --manifest-path tools/kratt-topology/Cargo.toml --all-targets -- -D warnings`
