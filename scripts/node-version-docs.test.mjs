// F07-01: README's Node statement agrees with .nvmrc and the CI workflow.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test(".nvmrc pins major 22 and CI reads it", () => {
  assert.equal(read(".nvmrc").trim(), "22");
  assert.match(read(".github/workflows/ci.yml"), /node-version-file: \.nvmrc/);
});

test("README names Node 22 via .nvmrc and the 22.13 minimum", () => {
  const readme = read("README.md");
  assert.match(readme, /Node\.js 22 \(pinned in `\.nvmrc`/);
  assert.match(readme, /minimum is 22\.13/);
  assert.doesNotMatch(readme, /22\.12\+/);
});
