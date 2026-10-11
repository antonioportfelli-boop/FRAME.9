// F01-03: both migration appliers read migrations/ NON-recursively, so the
// opt-in auth schema in migrations/auth/ is never selected until it is copied
// up. Complements migration-plan.test.mjs (which covers the plan function).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pendingMigrations } from "./migration-plan.mjs";
import { projectRoot } from "./with-app-env.mjs";

const root = projectRoot();
const read = (p) => readFileSync(join(root, p), "utf8");

test("deploy applier (migrate.mjs) uses a plain, non-recursive readdir", () => {
  const src = read("scripts/migrate.mjs");
  const calls = [...src.matchAll(/\breaddir\(([^)]*)\)/g)].map((m) => m[1]);
  assert.deepEqual(calls, ["migrationsDir"], "readdir must be called once, without options");
});

test("PGLite applier (db.ts) globs only top-level /migrations/*.sql", () => {
  const src = read("src/lib/db.ts");
  const globs = [...src.matchAll(/import\.meta\.glob\(\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(globs, ["/migrations/*.sql"]);
});

test("the non-recursive read is what keeps auth out", () => {
  const dir = join(root, "migrations");
  const flat = readdirSync(dir);
  const deep = readdirSync(dir, { recursive: true }).map(String);
  assert.deepEqual(pendingMigrations(flat, []), []);
  // A recursive read WOULD pick the auth schema up — guard against regressing to it.
  assert.deepEqual(
    pendingMigrations(deep, []).map((m) => m.name),
    ["0001_auth.sql"],
  );
});
