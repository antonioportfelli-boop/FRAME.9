// F01-01: src/lib/env.server.ts — env() normalisation and the preview/deployed
// split (isWorkspacePreview keys off GROK_PROJECT_ID, written by the deployer).
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { env, isWorkspacePreview } from "../src/lib/env.server.ts";

const KEYS = ["FRAME9_TEST_VAR", "GROK_PROJECT_ID"];
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

test("env returns the trimmed value", () => {
  process.env.FRAME9_TEST_VAR = "  value  ";
  assert.equal(env("FRAME9_TEST_VAR"), "value");
});

test("env treats unset, empty and whitespace-only as undefined", () => {
  delete process.env.FRAME9_TEST_VAR;
  assert.equal(env("FRAME9_TEST_VAR"), undefined);
  for (const v of ["", "   ", "\t\n"]) {
    process.env.FRAME9_TEST_VAR = v;
    assert.equal(env("FRAME9_TEST_VAR"), undefined, JSON.stringify(v));
  }
});

test("env reads process.env at call time (no caching)", () => {
  process.env.FRAME9_TEST_VAR = "a";
  assert.equal(env("FRAME9_TEST_VAR"), "a");
  process.env.FRAME9_TEST_VAR = "b";
  assert.equal(env("FRAME9_TEST_VAR"), "b");
});

test("isWorkspacePreview: true without GROK_PROJECT_ID, false when deployed", () => {
  delete process.env.GROK_PROJECT_ID;
  assert.equal(isWorkspacePreview(), true);
  process.env.GROK_PROJECT_ID = "   ";
  assert.equal(isWorkspacePreview(), true, "blank id is not a deployment");
  process.env.GROK_PROJECT_ID = "proj_123";
  assert.equal(isWorkspacePreview(), false);
});
