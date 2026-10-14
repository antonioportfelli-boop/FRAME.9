// Regression: a normal application build must never run database migrations.
// Deploy-time migration is opt-in through build:deploy and the Vercel buildCommand.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const MIGRATE = /db:migrate|migrate\.mjs/;

test("build and build:dev do not invoke the migrator", () => {
  for (const name of ["build", "build:dev"]) {
    assert.ok(pkg.scripts[name], `${name} script exists`);
    assert.doesNotMatch(pkg.scripts[name], MIGRATE, `${name} must not migrate`);
  }
});

test("db:migrate remains an explicit migration command", () => {
  assert.equal(pkg.scripts["db:migrate"], "node scripts/migrate.mjs");
});

test("deploy builds before running migrations and stops on build failure", () => {
  assert.equal(pkg.scripts["build:deploy"], "npm run build && npm run db:migrate");
  assert.equal(vercel.buildCommand, "npm run build:deploy");
});
