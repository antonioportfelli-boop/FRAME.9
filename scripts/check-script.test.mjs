// F07-03: `npm run check` runs the same local gates, in the same order, as the
// Forge.-9 CI `gates` job (TYPECHECK, LINT --max-warnings=0, TEST, BUILD).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** Read a repository file as UTF-8 for validation-command assertions. */
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));

test("check chains typecheck, strict lint, test and build", () => {
  assert.equal(
    pkg.scripts.check,
    "npm run typecheck && npm run lint -- --max-warnings=0 && npm test && npm run build",
  );
});

test("CI gates job runs the same commands in the same order", () => {
  const ci = read(".github/workflows/ci.yml");
  const order = ["npm run typecheck", "npm run lint -- --max-warnings=0", "npm test", "npm run build"];
  let at = -1;
  for (const cmd of order) {
    const i = ci.indexOf(`run: ${cmd}`, at + 1);
    assert.ok(i > at, `${cmd} after previous gate`);
    at = i;
  }
});
