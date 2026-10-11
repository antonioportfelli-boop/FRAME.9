import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonMemoryBank, normalizeEvent } from './ledger.mjs';

const base = () => ({
  schema_version: '1.0.0', event_id: 'evt:fixture:1',
  timestamp_utc: '2026-10-11T10:00:00Z', actor_id: 'agent:test', actor_type: 'agent',
  source_type: 'github', source_reference: 'repo:pr:1', repository: 'owner/repo',
  commit_sha: 'a'.repeat(40), action: 'test', status: 'VERIFIED',
  evidence_refs: ['https://github.com/owner/repo/actions/runs/1'],
  consent_reference: 'NOT_REQUIRED_PUBLIC', visibility_scope: 'public'
});

test('validated event gets deterministic SHA-256 content hash', () => {
  const a = normalizeEvent(base()), b = normalizeEvent({ ...base(), evidence_refs: [...base().evidence_refs] });
  assert.equal(a.content_hash, b.content_hash);
  assert.match(a.content_hash, /^[a-f0-9]{64}$/);
});
test('fail closed: evidence missing, secret found, mismatched hash, invalid consent', () => {
  assert.throws(() => normalizeEvent({ ...base(), evidence_refs: [] }), /VERIFIED requires/);
  assert.throws(() => normalizeEvent({ ...base(), action: 'Bearer ' + 'abcxyz1234567890' }), /credential/);
  assert.throws(() => normalizeEvent({ ...base(), content_hash: '0'.repeat(64) }), /mismatch/);
  assert.throws(() => normalizeEvent({ ...base(), visibility_scope: 'private' }), /consent/);
});
test('idempotent ingestion, collision detection, local erasure', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'kratt-ledger-'));
  const file = join(folder, 'bank.json');
  try {
    const bank = new JsonMemoryBank(file);
    assert.equal((await bank.ingest(base())).inserted, true);
    assert.equal((await bank.ingest(base())).inserted, false);
    assert.equal((await bank.list()).length, 1);
    await assert.rejects(() => bank.ingest({ ...base(), action: 'different' }), /collision/);
    assert.equal(await bank.erase('evt:fixture:1'), true);
    assert.equal(await bank.erase('evt:fixture:1'), false);
    assert.deepEqual(await bank.list(), []);
    assert.equal(JSON.parse(await readFile(file, 'utf8')).events.length, 0);
    if (process.platform !== 'win32') assert.equal((await stat(file)).mode & 0o777, 0o600);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
