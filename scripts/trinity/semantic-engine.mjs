/**
 * FRAME.9 Trinity semantic prototype.
 * Deterministic, evidence-preserving and intentionally non-clinical.
 */

export function validateGenealogyGraph({ people = [], assertions = [] } = {}) {
  const errors = [];
  const ids = new Set();
  for (const person of people) {
    if (!person?.id || typeof person.id !== "string") errors.push("person.id must be a non-empty string");
    else if (ids.has(person.id)) errors.push(`duplicate person id: ${person.id}`);
    else ids.add(person.id);
  }

  const adjacency = new Map([...ids].map((id) => [id, []]));
  const seenAssertions = new Set();
  for (const assertion of assertions) {
    const { id, parentId, childId, sourcePassageId, status } = assertion ?? {};
    if (!id || !parentId || !childId || !sourcePassageId) {
      errors.push("genealogy assertion requires id, parentId, childId and sourcePassageId");
      continue;
    }
    if (!ids.has(parentId) || !ids.has(childId)) errors.push(`unknown person in assertion: ${id}`);
    if (parentId === childId) errors.push(`self-parent relationship: ${id}`);
    if (seenAssertions.has(id)) errors.push(`duplicate assertion id: ${id}`);
    seenAssertions.add(id);
    if (status && !["attested", "disputed", "proposed"].includes(status)) {
      errors.push(`invalid assertion status: ${id}`);
    }
    if (ids.has(parentId) && ids.has(childId)) adjacency.get(parentId).push(childId);
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const child of adjacency.get(id) ?? []) if (visit(child)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  }
  for (const id of ids) {
    if (visit(id)) {
      errors.push("genealogy graph contains a cycle");
      break;
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Returns candidate readings, never a single authoritative interpretation.
 * A rule only matches when all its declared evidence tokens are present.
 */
export function evaluateInterpretiveCandidates({ passageId, evidence = [], rules = [] } = {}) {
  if (!passageId) throw new TypeError("passageId is required");
  const evidenceSet = new Set(evidence);
  return rules
    .filter((rule) => rule && Array.isArray(rule.requires) && rule.requires.length > 0)
    .map((rule) => {
      const matched = rule.requires.filter((token) => evidenceSet.has(token));
      const complete = matched.length === rule.requires.length;
      return {
        ruleId: rule.id,
        passageId,
        method: rule.method ?? "unspecified",
        matchedEvidence: matched,
        missingEvidence: rule.requires.filter((token) => !evidenceSet.has(token)),
        status: complete ? "candidate" : "insufficient-evidence",
        confidence: complete ? "rule-match-only" : "not-assessed",
        interpretation: rule.interpretation ?? null,
        requiresHumanReview: true,
      };
    })
    .sort((a, b) => a.ruleId.localeCompare(b.ruleId));
}

/** Deny-by-default command-block validation. No physical/clinical actuation. */
export function validateCommandBlock(block = {}) {
  const errors = [];
  const allowedCapabilities = new Set(["semantic.read", "semantic.analyze", "fixture.read", "report.write"]);
  if (!block.id || typeof block.id !== "string") errors.push("id is required");
  if (!Array.isArray(block.capabilities)) errors.push("capabilities must be an array");
  else {
    for (const capability of block.capabilities) {
      if (!allowedCapabilities.has(capability)) errors.push(`capability not permitted: ${capability}`);
    }
  }
  if (block.mode !== "dry-run") errors.push("mode must be dry-run");
  if (block.humanApproval !== true) errors.push("humanApproval must be true");
  if (block.rollback !== true) errors.push("rollback must be true");
  if (block.domain === "clinical" || block.domain === "physical-device") {
    errors.push(`domain prohibited in prototype: ${block.domain}`);
  }
  return { valid: errors.length === 0, errors };
}
