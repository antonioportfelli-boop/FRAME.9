/** KRATT Memory Bank V0 local prototype. Node 22, no external dependencies. */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, chmod } from 'node:fs/promises';
import { dirname } from 'node:path';

export const SCHEMA_VERSION = '1.0.0';
export const REQUIRED_FIELDS = Object.freeze([
  'schema_version', 'event_id', 'timestamp_utc', 'actor_id', 'actor_type',
  'source_type', 'source_reference', 'repository', 'commit_sha', 'action',
  'status', 'evidence_refs', 'consent_reference', 'visibility_scope'
]);
const SCOPES = new Set(['public', 'team', 'private']);
const STATUSES = new Set(['VERIFIED', 'PARTIAL', 'BLOCKED', 'NOT_RUN', 'FAILED']);
const MAX_EVENT_BYTES = 16_384;
const SECRET = /(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{16,}|Bearer\s+\S{8,}|(?:api[_-]?key|password|secret|token)\s*[=:]\s*['"]?[^\s,'"}]{8,})/i;

function fail(message) { throw new Error(`KRATT_VALIDATION: ${message}`); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
function hash(value) { return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex'); }

export function normalizeEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) fail('event must be object');
  const fields = [...REQUIRED_FIELDS, 'content_hash'];
  const extras = Object.keys(event).filter(key => !fields.includes(key));
  if (extras.length) fail(`unknown fields: ${extras.join(',')}`);
  for (const field of REQUIRED_FIELDS) {
    if (!(field in event)) fail(`missing ${field}`);
  }
  const result = structuredClone(event);
  for (const field of REQUIRED_FIELDS.filter(k => k !== 'evidence_refs')) {
    if (typeof result[field] !== 'string' || !result[field].trim()) fail(`invalid ${field}`);
  }
  if (result.schema_version !== SCHEMA_VERSION) fail('unsupported schema_version');
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(result.event_id)) fail('invalid event_id');
  const ts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(result.timestamp_utc);
  const millis = Date.parse(result.timestamp_utc);
  const date = new Date(millis);
  if (!ts || !Number.isFinite(millis) ||
      date.getUTCFullYear() !== Number(ts[1]) || date.getUTCMonth() + 1 !== Number(ts[2]) ||
      date.getUTCDate() !== Number(ts[3]) || date.getUTCHours() !== Number(ts[4]) ||
      date.getUTCMinutes() !== Number(ts[5]) || date.getUTCSeconds() !== Number(ts[6])) {
    fail('timestamp_utc must be a real UTC calendar instant');
  }
  if (!SCOPES.has(result.visibility_scope)) fail('unknown visibility_scope');
  if (!STATUSES.has(result.status)) fail('unknown status');
  if (!Array.isArray(result.evidence_refs) || result.evidence_refs.length > 30 ||
      result.evidence_refs.some(e => typeof e !== 'string' || !e.trim() || e.length > 1000 || [...e].some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127))) {
    fail('invalid evidence_refs');
  }
  if (result.status === 'VERIFIED' && result.evidence_refs.length === 0) fail('VERIFIED requires evidence_refs');
  if (result.visibility_scope !== 'public' && result.consent_reference === 'NOT_REQUIRED_PUBLIC') fail('non-public event needs consent');
  if (result.consent_reference !== 'NOT_REQUIRED_PUBLIC' &&
      !/^consent:[A-Za-z0-9][A-Za-z0-9._:-]{3,127}$/.test(result.consent_reference)) {
    fail('invalid consent reference marker');
  }
  if (result.commit_sha !== 'NOT_APPLICABLE' && !/^[a-f0-9]{40}$/.test(result.commit_sha)) fail('commit_sha must be full Git SHA');
  const payload = { ...result }; delete payload.content_hash;
  const serialized = JSON.stringify(stable(payload));
  if (Buffer.byteLength(serialized, 'utf8') > MAX_EVENT_BYTES) fail('event exceeds 16 KiB');
  if (SECRET.test(serialized)) fail('potential credential present; reject before storage');
  const digest = hash(payload);
  if (Object.hasOwn(result, 'content_hash') && result.content_hash !== digest) fail('content_hash mismatch');
  return { ...payload, content_hash: digest };
}

/** Single-process/single-writer JSON adapter. DO NOT use as network service. */
export class JsonMemoryBank {
  constructor(filePath) { if (!filePath) fail('file path required'); this.path = filePath; }
  async _read() {
    try {
      const db = JSON.parse(await readFile(this.path, 'utf8'));
      if (db.schema_version !== SCHEMA_VERSION || !Array.isArray(db.events)) fail('unsupported bank schema');
      const ids = new Set();
      for (const event of db.events) {
        const checked = normalizeEvent(event);
        if (!Object.hasOwn(event, 'content_hash') || checked.content_hash !== event.content_hash) {
          fail('stored event missing integrity hash');
        }
        if (ids.has(event.event_id)) fail('duplicate stored event_id');
        ids.add(event.event_id);
      }
      return db;
    } catch (error) {
      if (error.code === 'ENOENT') return { schema_version: SCHEMA_VERSION, events: [] };
      throw error;
    }
  }
  async _write(db) {
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
    const temp = `${this.path}.${process.pid}.tmp`;
    await writeFile(temp, JSON.stringify(db, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    try { await chmod(temp, 0o600); await rename(temp, this.path); }
    catch (err) { await import('node:fs/promises').then(fs => fs.unlink(temp).catch(() => {})); throw err; }
  }
  async ingest(event) {
    const normalized = normalizeEvent(event);
    const db = await this._read();
    const existing = db.events.find(e => e.event_id === normalized.event_id);
    if (existing) {
      if (existing.content_hash !== normalized.content_hash) fail('event_id collision with different content');
      return { inserted: false, content_hash: existing.content_hash };
    }
    db.events.push(normalized);
    await this._write(db);
    return { inserted: true, content_hash: normalized.content_hash };
  }
  async list({ visibility_scope } = {}) {
    const db = await this._read();
    return db.events.filter(e => !visibility_scope || e.visibility_scope === visibility_scope);
  }
  /** Erasure is supported in active local bank only, not external backups. */
  async erase(eventId) {
    const db = await this._read();
    const filtered = db.events.filter(e => e.event_id !== eventId);
    if (filtered.length === db.events.length) return false;
    db.events = filtered;
    await this._write(db);
    return true;
  }
}
