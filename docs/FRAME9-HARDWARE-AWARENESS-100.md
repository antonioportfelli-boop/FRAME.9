# FRAME.9 — 100-step hardware-awareness roadmap

"Awareness" here means **verified, permissioned OS/kernel/hardware context**, not consciousness or unrestricted kernel access. Each item requires verifiable evidence at its gate; do not convert a planned feature into an implemented status.

## Phase 1: Source of truth and requirements

1. Resolve current FRAME.9 Forge.-9 SHA before implementation.
2. Keep organization Frame.-9 as a separately audited repository.
3. Define Linux host agent vs hosted FRAME.9 frontend boundaries.
4. Define Android native code vs PWA/Termux boundaries.
5. Version snapshot schema, UTC timestamp and capability states.
6. Differentiate VERIFIED, UNAVAILABLE, UNSUPPORTED and UNAUTHORIZED.
7. Record supported Linux distributions and Python versions.
8. Inventory target laptop CPU architecture and kernel family.
9. Inventory target Android OS/API versions and hardware families.
10. G1: approve read-only hardware-context specification.

## Phase 2: Privacy, safety and authority

11. Threat-model local malicious web pages requesting the agent.
12. Threat-model remote connections, DNS rebinding and leaked tokens.
13. Inventory sensitive device identifiers before gathering data.
14. Exclude hostnames, serials, MACs and IPs by default.
15. Specify consent, retention, erasure and purpose limitation.
16. Require enrollment before transmitting anything to FRAME.9 Cloud.
17. Never ship default passwords, service-role keys or browser tokens.
18. Run host discovery without root or privileged capabilities.
19. Specify local token rotation and remote-device revocation.
20. G2: prove no unapproved collection or kernel writes.

## Phase 3: Linux kernel facts

21. Read Linux OS family and uname kernel release.
22. Read kernel-supported CPU architecture.
23. Read logical CPU count and label it accurately.
24. Read CPU model from permitted procfs keys.
25. Read RAM totals and available memory from procfs.
26. Read uptime and handle permission failures.
27. Parse Linux /etc/os-release without eval or shell.
28. Report procfs readability explicitly.
29. Report sysfs readability explicitly.
30. G3: produce a real versioned Linux JSON snapshot.

## Phase 4: Hardware and resource context

31. Read non-unique product model when permitted.
32. Exclude serial/board unique identifiers without explicit opt-in.
33. Separate VM/container visibility from physical hardware claims.
34. Detect GPU adapters via safe, narrow read-only APIs.
35. Detect filesystem free space using statvfs only.
36. Detect interfaces without exporting addresses or MAC by default.
37. Detect optional battery/power state where readable.
38. Add bounded CPU/memory utilization sampling.
39. Capture data provenance and per-capability availability.
40. G4: test on distinct Linux hardware classes with null-on-unknown.

## Phase 5: Local agent/API boundary

41. Ship a dependency-free, one-shot JSON snapshot CLI.
42. Bind optional agent HTTP exclusively to 127.0.0.1.
43. Require an ephemeral cryptographically strong bearer token.
44. Reject Origin and untrusted Host headers with no wildcard CORS.
45. Implement authenticated health and snapshot routes.
46. Validate output schema and enforce payload limits.
47. Implement concurrency and resource limits.
48. Package as opt-in local service after CLI validation.
49. Redact logs and provide reliable stop/start controls.
50. G5: verify localhost permissions and rejected unauthorized requests.

## Phase 6: Android/Linux device integration

51. Choose APK/native bridge, PWA/TWA or Termux proof explicitly.
52. Respect Android application sandbox and Linux kernel restrictions.
53. Read Android hardware and OS facts through documented APIs.
54. Read permitted Android kernel version without attempting root.
55. Use native Android APIs for CPU/RAM/model where available.
56. Implement reviewed Capacitor/Kotlin bridge if actually required.
57. Request permissions only when necessary, in context.
58. Test Android 13–16 and vendor permission limits.
59. Generate and install a real Android debug APK.
60. G6: compare physical device results to Android Settings.

## Phase 7: Secure pairing and transport

61. Generate per-device keypair in secure OS storage.
62. Create short-lived user-initiated pairing challenge.
63. Require user confirmation for each device enrollment.
64. Use authenticated encrypted transport, preferably outbound only.
65. Prevent pairing replay and cross-device impersonation.
66. Enable key renewal, expiration and revocation.
67. Track UNPAIRED, PENDING, VERIFIED, REVOKED and UNREACHABLE.
68. Keep telemetry-read scopes distinct from device-control scopes.
69. Respect user-chosen frequency, power and bandwidth budgets.
70. G7: prove only authorized users can access the right device.

## Phase 8: FRAME.9 and GOLIATH integration

71. Render Devices dashboard with source timestamp and status.
72. Enforce device permissions on backend using RBAC.
73. Persist only explicitly consented and minimized telemetry.
74. Bind agent version and Git SHA to verification evidence.
75. Connect GOLIATH only via a verified authenticated API.
76. Distinguish read-only kernel context from OS admin capabilities.
77. Offer diagnostics without silently mutating the operating system.
78. Require explicit user approval for any OS change and rollback.
79. Treat kernel modules as exceptional, separately reviewed software.
80. G8: prove a real laptop appears in FRAME.9 through secure pairing.

## Phase 9: Testing and evidence

81. Fixture-test kernel, CPU, memory and OS-release parsers.
82. Integrate-test bearer auth, loopback, Origin and Host protection.
83. Test on the user's actual Linux laptop and sanitize snapshots.
84. Test under missing procfs/sysfs and container restrictions.
85. Test x86_64 and ARM64 hardware or documented fixtures.
86. Test Android permission-denied and lifecycle scenarios.
87. Test revoked pairing, stale sessions and malformed input.
88. Run GitHub Actions checks with least-privilege permissions.
89. Store SHA-linked offline test evidence and artifact hashes.
90. G9: verify integration tip after merging, not just PR branches.

## Phase 10: Controlled operational alpha

91. Resolve any active hardcoded OAuth preview secrets.
92. Separate normal app builds from production database migrations.
93. Verify real login/logout/session and server-side roles.
94. Deploy authenticated backend under TLS and minimized scopes.
95. Document reproducible Linux laptop installation.
96. Build Android APK/AAB with signed artifacts and SHA-256 evidence.
97. Pair laptop and phone separately with user approval.
98. Verify refresh, disconnect, revocation and recovery.
99. Publish VERIFIED/PARTIAL/BLOCKED/NOT_RUN release matrix.
100. G10: prove both physical devices report truthful hardware context securely.

## Current verified scope

Initial local MVP: Linux `/proc`/`/sys` read-only snapshot; 127.0.0.1-only authenticated API; deterministic parser and HTTP authorization tests. **No actual user's laptop/phone measurement, remote enrollment, Android APK, direct web/cloud link, or autonomous kernel control exists yet.**

## Next measurable gate

On the physical laptop execute `python3 tools/host-probe/frame9_host_probe.py snapshot` and compare `kernel.release`, CPU and RAM to local OS commands. Avoid sharing personal identifiers. Before public dashboard integration, implement secure pairing and server-side authorization.
