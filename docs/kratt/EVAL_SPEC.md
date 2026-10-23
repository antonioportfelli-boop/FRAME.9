# TÖEPÄRA evidence/evaluation spec v1
Status: PARTIAL.

For each proposed improvement record: goal, base SHA, candidate SHA, test command, expected outcome, actual outcome, risk, cost, latency, source refs, reviewer agreement, decision and rollback instructions.

## Mandatory gates
E01 Provenance: exact repo+ref+SHA+artifact. E02 Reproducibility: deterministic local test. E03 Privacy: consent/scope/redaction and erase. E04 Security: no secrets, no default access, no high-risk execution. E05 Regression: incumbent version and candidate run same corpus. E06 Authorization: human approval for deploy, merge, hardware mutation, live payments. E07 Reflection: explanation of test failure and correction.

## Metrics (all NOT_RUN except V0 unit fixtures)
Claim accuracy: verified supported claims / checked claims. Source traceability: claims with resolvable reference / claims. Task completion: accepted tasks / attempted tasks. Regression count: failing baseline tests after patch. Retrieval precision@5 + recall@5 against labelled query set. Intent alignment: approved goals satisfied / relevant approved goals. Safety violations: zero allowed. Cost: tokens/credits + infrastructure EUR. Execution time: elapsed local/CI seconds.
Do not treat green general CI as approval of security, retention, RLS, physical pairing or agent autonomy.

## H01–H10 contracts and status
| Skill | Input → output | Evidence / permission / failure / rollback | State |
| --- | --- | --- | --- |
| H01 MERGE FORENSICS | repo+PR→diff ledger | read-only GitHub; exact SHAs; API failure BLOCKED; no mutation | PARTIAL |
| H02 DUAL MIRROR REVIEW | 2 independent reviews→disagreements | second independent reviewer; preserve contrary claims; no code write | NOT_RUN |
| H03 EVIDENCE GATE | candidate status+links→accepted/rejected | VERIFIED requires links; reject else; rollback by deleting local fixture | PARTIAL |
| H04 ERROR REFLECTION LEDGER | failure+fix→outcome record | preserve input provenance; no auto-adopt; erase record via consent | NOT_RUN |
| H05 COUNTERFACTUAL REPLAY | baseline+candidate→isolated comparison | offline only, identical fixtures; discard shadow | NOT_RUN |
| H06 SHADOW DEPLOYMENT | candidate→isolated deploy report | never production DNS; remove shadow | NOT_RUN |
| H07 SKILL EVOLUTION REGISTRY | signed version+tests→candidate | explicit approvals; pin former version | NOT_RUN |
| H08 MEMORY COMPRESSION EVALUATOR | records+golden set→fidelity | precision and source retention; keep raw only with consent | NOT_RUN |
| H09 ARCHITECT MIRROR | signed intents+proposal→alignment | never diagnose person; correct/delete intents | NOT_RUN |
| H10 BOUNDED AUTONOMOUS BUILDER | approved issue→draft PR | allowlisted repos/files, no merge/deploy/payments; close PR | NOT_RUN |

Each skill is version 0.1 proposal unless a concrete tool path/test above exists. Failed tests must block promoting candidate to VERIFIED.
