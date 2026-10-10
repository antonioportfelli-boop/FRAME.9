FRAME.9 host reader

This is not an operating system. It is a small reader you run on the computer you already have.
It uses that login's rights. On Windows it asks the real Windows elevation prompt. It does not draw a Microsoft window inside the browser.

It writes frame9-host-report.json to the Desktop. Import that file from the Account panel in the desk.

It lists adapters, visible Wi-Fi, and device classes the OS already shows.
It does not turn on monitor mode, inject frames, read hidden carriers, or capture other people's traffic.

Windows: right-click Start-Frame9Host.ps1 and run with PowerShell.
Linux: sh frame9-host.sh
