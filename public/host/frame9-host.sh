#!/bin/sh
# FRAME.9 host reader for Linux. Uses the rights of the account that runs it.
# Visible interfaces and Wi-Fi only. No monitor mode, no injection, no payloads.
set -eu
python3 - <<'PY'
import datetime, json, os, shutil, subprocess
def run(cmd):
    if not shutil.which(cmd[0]):
        return f"{cmd[0]} is not installed"
    try:
        return subprocess.check_output(cmd, stderr=subprocess.DEVNULL, text=True, timeout=8)
    except Exception as exc:
        return str(exc)
report = {
    "tool": "FRAME.9 host",
    "at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "user": os.environ.get("USER") or "",
    "note": "Visible OS data only. Hidden carriers and other people's traffic are not read.",
    "ip_link": run(["ip", "-br", "link"]),
    "wifi": run(["nmcli", "-t", "-f", "IN-USE,SSID,SIGNAL,SECURITY", "dev", "wifi", "list"]),
}
desktop = os.path.join(os.path.expanduser("~"), "Desktop")
folder = desktop if os.path.isdir(desktop) else os.path.expanduser("~")
path = os.path.join(folder, "frame9-host-report.json")
with open(path, "w", encoding="utf-8") as handle:
    json.dump(report, handle, indent=2)
print("Wrote", path)
PY
