# FRAME.9 Host Probe v0.1 — Linux kernel/hardware awareness

**Status: working local read-only proof, not yet enrolled in FRAME.9 Cloud.** A Linux laptop (or an Android terminal with permitted access) can describe its own hardware and Linux kernel. This is **hardware-context awareness, not consciousness**. No kernel module, root access or privilege escalation.

## Requirements

- Linux, Python 3.10+; no pip dependencies.
- Reads kernel release, OS distribution, architecture, CPU model/count, RAM, uptime and non-unique device model via `platform`, fixed paths under `/proc` and `/sys`.
- Missing/denied OS files become `null`; no serial numbers, MAC/IP addresses or hostname by default.
- No background auto-start, arbitrary shell commands, remote writes, or outbound network access.

## Laptop terminal: prove hardware awareness

```bash
python3 tools/host-probe/frame9_host_probe.py snapshot
python3 -m unittest discover -s tools/host-probe -p 'test_*.py' -v
```

If explicitly desired, append `--include-hostname` to the snapshot command.

## Optional localhost API

First terminal:

```bash
export FRAME9_HOST_AGENT_TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
python3 tools/host-probe/frame9_host_probe.py serve --port 8769
```

Second terminal **in the same Linux session** (reuse the same secret, not a freshly generated value):

```bash
curl --fail --silent --show-error -H "Authorization: Bearer $FRAME9_HOST_AGENT_TOKEN" http://127.0.0.1:8769/v1/health
curl --fail --silent --show-error -H "Authorization: Bearer $FRAME9_HOST_AGENT_TOKEN" http://127.0.0.1:8769/v1/snapshot
```

The service binds only `127.0.0.1`, requires a 32+ character secret, rejects browser `Origin` and untrusted `Host` headers, and provides **no CORS**. Stop with Ctrl+C.

**Never port-forward this service, commit its secret, or embed the token into a web frontend.** Browser-only FRAME.9 cannot access another device's kernel. Remote/cloud connection requires separate audited enrollment, device identity, user authorization and encrypted transport.

## Android distinction

Android runs Linux but restricts userland access to kernel and device metadata. With Termux and Python, some fields may be readable; inaccessible fields must be reported as unavailable. A real APK/Kotlin native bridge remains a separate project milestone. This patch produces **no APK**.

## Evidence, scope and next gate

- Unit/loopback tests: `test_host_probe.py`.
- Accepted outputs: JSON snapshot, authenticated `/v1/health` and `/v1/snapshot`.
- No service pairing, stable device identifier, GPU/disk inventory, telemetry upload, OS mutation, or production deployment.
- Roadmap: `docs/FRAME9-HARDWARE-AWARENESS-100.md`.

Next: run the snapshot on the user's **physical Linux laptop**, compare with `uname -r`, `lscpu`, `free -m`, and only then design the authenticated pairing layer.
