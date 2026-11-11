import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { decide } from '../tools/kratt-prime/policy.mjs'

const load = (name) => JSON.parse(readFileSync(new URL(`../tools/kratt-prime/${name}.json`, import.meta.url), 'utf8'))
const contract = load('contract')
const registry = load('agents')
const policies = load('policies')

test('approved summary is an inactive implementation specification', () => {
  assert.equal(contract.name, 'KRATT_PRIME')
  assert.equal(contract.release, 'MEGALITHIC-v1.0')
  assert.equal(contract.status, 'IMPLEMENTATION_SPECIFICATION')
  assert.equal(contract.source.kind, 'approved_spec_summary')
  assert.equal(contract.source.verbatim, false)
  assert.deepEqual(contract.implementation, { state: 'inactive_scaffold', operational: false })
  assert.deepEqual(contract.architecture, { type: 'hybrid', orchestration: 'centralized', execution: 'distributed', reasoning: 'multi_model', autonomy: 'high_with_policy_controls' })
  assert.deepEqual(contract.engines, ['reasoning', 'scientific', 'mathematical', 'simulation', 'optimization', 'adversarial', 'evidence'])
  assert.deepEqual(contract.competition, { profiles: ['musk_first_principles', 'bezos_customer_scale', 'kratt_hybrid'], requirements: ['equal_compute_budget', 'blind_evaluation', 'independent_validation', 'reproducibility', 'evidence_required'], implemented: false })
  assert.deepEqual(contract.scientific_output, ['citations', 'provenance', 'uncertainty', 'reproducibility', 'independent_criticism'])
})

test('all integration roles are declared but disabled and unimplemented', () => {
  const roles = { telegram: 'command_interface', grok: 'ai_adapter', frame9: 'shared_platform', aura: 'runtime', steel: 'mobile_runtime', cerberus: 'android', goliath_os: 'orchestration' }
  assert.deepEqual(Object.keys(contract.integrations), Object.keys(roles))
  for (const [name, role] of Object.entries(roles)) {
    assert.deepEqual(contract.integrations[name], { role, state: 'unimplemented', enabled: false })
  }
})

test('15 distinct inert agents require independent validation and cannot self-approve', () => {
  assert.deepEqual(contract.agents, { count: 15, independent_validation: true, self_approval: false })
  assert.equal(registry.state, 'inactive_scaffold')
  assert.equal(registry.agents.length, 15)
  assert.equal(new Set(registry.agents.map((agent) => agent.id)).size, 15)
  for (const [index, agent] of registry.agents.entries()) {
    assert.deepEqual(agent, { id: `kratt-${String(index + 1).padStart(2, '0')}`, state: 'unimplemented', enabled: false, role: null, independent_validation_required: true, self_approval: false })
  }
})

test('policy registry preserves governance and denies activation/deployment', () => {
  const governance = { policy_engine: true, audit_logging: true, human_approval: true, secret_protection: true, reversible_changes: true, production_deployment: false }
  assert.deepEqual(contract.governance, governance)
  assert.deepEqual(policies.requirements, { ...governance, independent_validation: true, self_approval: false })
  assert.equal(policies.state, 'inactive_scaffold')
  assert.equal(policies.default_decision, 'deny')
  assert.equal(policies.activation_supported, false)
})

test('fail-closed for missing, malformed, unknown, self-approved and human-approved requests', () => {
  const requests = [undefined, null, false, '', 1, [], {}, { action: 'unknown' }, { action: 'deploy', humanApproved: true }, { action: 'activate', enabled: true }, { action: 'run_agent', actor: 'kratt-01', approver: 'kratt-01' }, { action: 'competition', humanApproved: true, independentValidation: true }, { action: 'telegram', token: 'not-a-real-token' }]
  for (const request of requests) {
    const result = decide(request)
    assert.deepEqual(result, { allowed: false, reason: 'KRATT_PRIME_INACTIVE_UNIMPLEMENTED' })
    assert.equal(Object.isFrozen(result), true)
  }
})
