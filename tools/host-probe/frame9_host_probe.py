#!/usr/bin/env python3
"""FRAME.9 Linux host awareness v0.1: read-only kernel telemetry via procfs/sysfs.

No root access, subprocess, persistence, identifiers, or outbound network calls.
The optional HTTP endpoint listens on loopback only, with a mandatory bearer token.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import hmac
import json
import os
from pathlib import Path
import platform
import re
import sys
from typing import Callable

SCHEMA_VERSION = 1
MAX_READ_BYTES = 65536


def read_limited(path: Path) -> str | None:
    """Read only known virtual-system paths; callers do not supply arbitrary user paths."""
    try:
        with path.open("rb") as stream:
            return stream.read(MAX_READ_BYTES).decode("utf-8", errors="replace").replace("\x00", "").strip()
    except (OSError, ValueError):
        return None


def parse_os_release(raw: str | None) -> dict[str, str | None]:
    entries: dict[str, str] = {}
    for line in (raw or "").splitlines():
        if not line or line.lstrip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key in {"ID", "PRETTY_NAME", "VERSION_ID"}:
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
                value = value[1:-1]
            entries[key] = value[:200]
    return {"id": entries.get("ID"), "pretty_name": entries.get("PRETTY_NAME"), "version_id": entries.get("VERSION_ID")}


def parse_meminfo(raw: str | None) -> dict[str, int | None]:
    mem: dict[str, int] = {}
    for line in (raw or "").splitlines():
        match = re.fullmatch(r"(MemTotal|MemAvailable):\s*(\d+)\s+kB\s*", line)
        if match:
            mem[match.group(1)] = int(match.group(2)) // 1024
    return {"total_mib": mem.get("MemTotal"), "available_mib": mem.get("MemAvailable")}


def parse_cpu_model(raw: str | None) -> str | None:
    lines = (raw or "").splitlines()
    for prefix in ("model name", "hardware", "processor"):
        for line in lines:
            if ":" not in line:
                continue
            label, value = line.split(":", 1)
            value = value.strip()
            if label.strip().lower() == prefix and value and not value.isdigit():
                return value[:160]
    return None


def collect_snapshot(*, include_hostname: bool = False, proc: Path = Path("/proc"), sysroot: Path = Path("/sys"), os_release: Path = Path("/etc/os-release")) -> dict:
    """Collect non-unique device facts; absence of permissions is reported, not bypassed."""
    is_linux = platform.system() == "Linux"
    mem = read_limited(proc / "meminfo") if is_linux else None
    cpu = read_limited(proc / "cpuinfo") if is_linux else None
    model = None
    if is_linux:
        model = read_limited(sysroot / "devices/virtual/dmi/id/product_name") or read_limited(proc / "device-tree/model")
    uptime_text = read_limited(proc / "uptime") if is_linux else None
    uptime_seconds = None
    if uptime_text:
        try:
            uptime_seconds = max(0, int(float(uptime_text.split()[0])))
        except (ValueError, IndexError, OverflowError):
            pass
    result = {
        "schema_version": SCHEMA_VERSION,
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "agent": {"name": "frame9-host-probe", "version": "0.1.0", "mode": "read-only", "root_required": False},
        "support": "available" if is_linux else "unsupported_os",
        "os": {"family": platform.system(), "distribution": parse_os_release(read_limited(os_release) if is_linux else None)},
        "kernel": {"name": platform.system(), "release": platform.release(), "architecture": platform.machine()},
        "hardware": {"product_model": (model[:160] if model else None), "cpu_model": parse_cpu_model(cpu),
                     "logical_cpus": os.cpu_count(), "memory": parse_meminfo(mem)},
        "runtime": {"python": platform.python_version(), "uptime_seconds": uptime_seconds},
        "kernel_interfaces": {"procfs_accessible": is_linux and mem is not None,
                              "sysfs_accessible": is_linux and sysroot.is_dir()},
        "privacy": {"hostname_included": include_hostname, "serial_numbers_included": False,
                    "mac_addresses_included": False, "ip_addresses_included": False},
    }
    if include_hostname:
        result["hostname"] = platform.node()
    return result


def make_handler(token: str, snapshot_provider: Callable[[], dict] = collect_snapshot) -> type[BaseHTTPRequestHandler]:
    if len(token) < 32:
        raise ValueError("FRAME9_HOST_AGENT_TOKEN must contain at least 32 characters")

    class Handler(BaseHTTPRequestHandler):
        server_version = "FRAME9HostProbe/0.1"
        sys_version = ""

        def log_message(self, *_args: object) -> None:
            # Never log Authorization header or host data.
            return

        def send_json(self, code: int, payload: dict) -> None:
            body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:
            # Explicitly reject browser origins and non-loopback host headers.
            host = (self.headers.get("Host") or "").split(":", 1)[0].lower()
            if self.headers.get("Origin") is not None or host not in {"localhost", "127.0.0.1"}:
                self.send_json(403, {"error": "local_request_only"})
                return
            auth = self.headers.get("Authorization") or ""
            if not hmac.compare_digest(auth, "Bearer " + token):
                self.send_json(401, {"error": "unauthorized"})
                return
            if self.path == "/v1/health":
                self.send_json(200, {"status": "ok", "service": "frame9-host-probe", "schema_version": SCHEMA_VERSION})
            elif self.path == "/v1/snapshot":
                self.send_json(200, snapshot_provider())
            else:
                self.send_json(404, {"error": "not_found"})

    return Handler


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="FRAME.9 local Linux kernel/hardware discovery, read-only")
    parser.add_argument("command", choices=["snapshot", "serve"])
    parser.add_argument("--include-hostname", action="store_true", help="Opt in to hostname in output")
    parser.add_argument("--port", type=int, default=8769, help="Loopback port (default: 8769)")
    args = parser.parse_args(argv)
    if args.command == "snapshot":
        print(json.dumps(collect_snapshot(include_hostname=args.include_hostname), indent=2, sort_keys=True))
        return 0
    if not 1 <= args.port <= 65535:
        parser.error("--port must be in 1..65535")
    token = os.environ.get("FRAME9_HOST_AGENT_TOKEN", "")
    if len(token) < 32:
        parser.error("Set FRAME9_HOST_AGENT_TOKEN (>=32 chars); generate using Python secrets.token_urlsafe(32)")
    server = ThreadingHTTPServer(("127.0.0.1", args.port), make_handler(token, lambda: collect_snapshot(include_hostname=args.include_hostname)))
    print(f"FRAME.9 host-probe on http://127.0.0.1:{args.port} (loopback only)", file=sys.stderr)
    try:
        server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
