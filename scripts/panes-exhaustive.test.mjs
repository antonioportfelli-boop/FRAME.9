// F03-03: every ModuleId has its own case in ModuleBody (Panes.tsx), and the
// switch ends in a `never` check so tsc rejects a missing case.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const union = read("src/lib/signal/types.ts").match(/export type ModuleId =([^;]+);/)[1];
const ids = [...union.matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
const panes = read("src/components/modules/Panes.tsx");

test("ModuleId union is parsed", () => {
  assert.ok(ids.length >= 18, `found ${ids.length}`);
});

test("each ModuleId has exactly one case in ModuleBody", () => {
  for (const id of ids) {
    const n = panes.split(`case "${id}":`).length - 1;
    assert.equal(n, 1, `case "${id}"`);
  }
});

test("switch is closed by a never-typed exhaustiveness check", () => {
  assert.match(panes, /const unhandled: never = id;/);
});
