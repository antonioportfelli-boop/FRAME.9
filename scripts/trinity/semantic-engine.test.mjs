import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateInterpretiveCandidates,
  validateCommandBlock,
  validateGenealogyGraph,
} from "./semantic-engine.mjs";

test("genealogy validator accepts a sourced acyclic graph", () => {
  const result = validateGenealogyGraph({
    people: [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
    assertions: [
      { id: "a1", parentId: "p1", childId: "p2", sourcePassageId: "Gen.1", status: "attested" },
      { id: "a2", parentId: "p2", childId: "p3", sourcePassageId: "Gen.2", status: "disputed" },
    ],
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("genealogy validator rejects cycles and unknown people", () => {
  const result = validateGenealogyGraph({
    people: [{ id: "p1" }, { id: "p2" }],
    assertions: [
      { id: "a1", parentId: "p1", childId: "p2", sourcePassageId: "P.1" },
      { id: "a2", parentId: "p2", childId: "p1", sourcePassageId: "P.2" },
      { id: "a3", parentId: "missing", childId: "p1", sourcePassageId: "P.3" },
    ],
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("cycle")));
  assert.ok(result.errors.some((error) => error.includes("unknown person")));
});

test("interpretive engine preserves incomplete alternatives and requires review", () => {
  const results = evaluateInterpretiveCandidates({
    passageId: "Ex.20.1",
    evidence: ["repeated-phrase"],
    rules: [
      { id: "rule-b", method: "parallelism", requires: ["parallel-structure"], interpretation: "Possible parallel reading" },
      { id: "rule-a", method: "repetition", requires: ["repeated-phrase"], interpretation: "Possible repetition reading" },
    ],
  });
  assert.deepEqual(results.map((item) => item.ruleId), ["rule-a", "rule-b"]);
  assert.equal(results[0].status, "candidate");
  assert.equal(results[1].status, "insufficient-evidence");
  assert.ok(results.every((item) => item.requiresHumanReview));
});

test("command block is deny-by-default and only allows dry-run semantic work", () => {
  assert.equal(validateCommandBlock({
    id: "demo", capabilities: ["semantic.read", "semantic.analyze"],
    mode: "dry-run", humanApproval: true, rollback: true, domain: "textual",
  }).valid, true);
  const blocked = validateCommandBlock({
    id: "device", capabilities: ["device.stimulate"],
    mode: "live", humanApproval: false, rollback: false, domain: "physical-device",
  });
  assert.equal(blocked.valid, false);
  assert.ok(blocked.errors.length >= 4);
});
