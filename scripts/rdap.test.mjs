// F06-01: public RDAP lookup helpers (src/lib/rdap.ts). Asserts current,
// intended behaviour only; known gaps are listed in the PR, not locked in here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { kindOf, textOf, trimRecord } from "../src/lib/rdap.ts";

test("kindOf classifies IPv4, IPv6, domains and ASNs", () => {
  assert.equal(kindOf("8.8.8.8"), "ip");
  assert.equal(kindOf("2001:db8::1"), "ip");
  assert.equal(kindOf("example.com"), "domain");
  assert.equal(kindOf("sub.example.co.uk"), "domain");
  assert.equal(kindOf("15169"), "autnum");
  assert.equal(kindOf("ASN:15169"), "autnum");
});

test("kindOf rejects empty and malformed input", () => {
  for (const q of ["", "not a host", "localhost", "-bad-.com", "a".repeat(254) + ".com", "http://example.com"]) {
    assert.equal(kindOf(q), null, q);
  }
});

test("textOf keeps trimmed non-empty strings, capped at 180 chars", () => {
  assert.equal(textOf("  x  "), "x");
  assert.equal(textOf("   "), null);
  assert.equal(textOf(42), null);
  assert.equal(textOf("y".repeat(500))?.length, 180);
});

test("trimRecord picks name, then ldhName, then the first entity's vCard fn", () => {
  assert.equal(trimRecord({ name: "NET-A", ldhName: "a.example" }).name, "NET-A");
  assert.equal(trimRecord({ ldhName: "a.example" }).name, "a.example");
  // NOTE: trimRecord scans vcardArray's top-level items, so this flat shape is
  // what it reads today. RFC 7095 nests properties at vcardArray[1]; that gap
  // is reported in the PR rather than asserted here.
  const flat = { entities: [{ vcardArray: [["version", {}, "text", "4.0"], ["fn", {}, "text", "Example Org"]] }] };
  assert.equal(trimRecord(flat).name, "Example Org");
});

test("trimRecord returns only whitelisted fields and nulls for non-objects", () => {
  const r = trimRecord({ handle: "H1", type: "ALLOCATION", country: "EE", startAddress: "1.0.0.0", endAddress: "1.0.0.255", secret: "drop" });
  assert.deepEqual(Object.keys(r).sort(), ["country", "endAddress", "handle", "name", "startAddress", "type"]);
  assert.equal(r.country, "EE");
  for (const v of [null, "x", 5, []]) {
    assert.deepEqual(trimRecord(v), { name: null, handle: null, type: null, country: null, startAddress: null, endAddress: null });
  }
});
