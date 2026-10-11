// Regression: `npm run build` must never run the database migrator. Migration is
// an explicit deploy step (`db:migrate`, chained only by `build:deploy`, which
// vercel.json uses as its buildCommand). See F01-02.
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

test("db:migrate still runs scripts/migrate.mjs", () => {
  assert.equal(pkg.scripts["db:migrate"], "node scripts/migrate.mjs");
});

test("deploy build migrates only after a successful build", () => {
  assert.equal(pkg.scripts["build:deploy"], "npm run build && npm run db:migrate");
  assert.equal(vercel.buildCommand, "npm run build:deploy");
});
