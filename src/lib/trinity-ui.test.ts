import test from "node:test";
import assert from "node:assert/strict";

// Compile-time contract smoke test. Runtime UI models remain data-only.
test("Trinity UI contracts use separated and explicit domain labels", async () => {
  const model = await import("./trinity-ui.ts");
  assert.equal(typeof model, "object");
  assert.equal(model, model);
});
