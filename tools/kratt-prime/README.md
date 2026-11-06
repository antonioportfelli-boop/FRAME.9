# KRATT_PRIME — inactive contract and registry scaffold

Release MEGALITHIC-v1.0 / IMPLEMENTATION_SPECIFICATION.

These files encode the available approved specification **summary**, not verbatim
original YAML. Architecture, engines, competition profiles, integrations and
scientific outputs are requirements only, not working features.

- `contract.json`: requested capabilities and governance requirements.
- `agents.json`: exactly 15 disabled placeholder slots; no invented role assignments.
- `policies.json`: policy requirements and default denial.
- `policy.mjs`: pure fail-closed entrypoint; denies **every** request, including
  requests claiming human approval. There is no activation switch.

No Telegram tokens, live adapters, model competitions, agent processes, audit
service, deployment or external connections are implemented. Audit logging,
secret protection, independent review and human approval are contractual
requirements, not claims that operational controls exist. This code is not wired
into FRAME.9 runtime and cannot approve or execute an action. Existing production
and routines remain stopped; this PR does not resume them.

Future implementation requires separately approved scope, durable audit/provenance,
independent validators (never self-approval), human approval and security gates.
Production deployment is forbidden by this contract. No such work is included.

Offline checks (Node built-ins only; no installation or network):

```sh
node --test scripts/kratt-prime.test.mjs
```

The tests verify summary requirements and unconditional denial. They do not prove
scientific performance, integration readiness or repository-wide build health.
