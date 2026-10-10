# FRAME.9 host reader. Asks Windows for a real elevation prompt (RunAs).
# Reads only what the operating system already exposes. No monitor mode,
# no injection, no hidden-SSID brute force, no packet payload capture.
$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Start-Process -FilePath "powershell" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
  exit
}

$report = [ordered]@{
  tool = "FRAME.9 host"
  at = (Get-Date).ToUniversalTime().ToString("o")
  computer = $env:COMPUTERNAME
  user = $env:USERNAME
  os = (Get-CimInstance Win32_OperatingSystem | Select-Object -ExpandProperty Caption)
  adapters = @()
  wifi = @()
  radios = @()
  note = "Visible OS data only. Hidden carriers and other people's traffic are not read."
}

try {
  $report.adapters = @(Get-NetAdapter | Select-Object Name, Status, MacAddress, LinkSpeed, InterfaceDescription)
} catch {}

try {
  $raw = netsh wlan show networks mode=bssid 2>&1 | Out-String
  $report.wifi = @($raw -split "`r?`n" | Where-Object { $_.Trim().Length -gt 0 })
} catch {}

try {
  $report.radios = @(Get-PnpDevice -Class Net,Bluetooth,Camera,Media -ErrorAction SilentlyContinue |
    Select-Object Status, Class, FriendlyName)
} catch {}

$out = Join-Path ([Environment]::GetFolderPath("Desktop")) "frame9-host-report.json"
$report | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 $out
Write-Output "Wrote $out"
