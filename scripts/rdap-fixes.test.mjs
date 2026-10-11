// F06-xx regression tests for defects reported in PR #9. Written failing-first.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as rdap from "../src/lib/rdap.ts";

const { kindOf, trimRecord } = rdap;

test("RFC 7095 jCard: fn is read from vcardArray[1]", () => {
  const record = {
    entities: [
      {
        vcardArray: [
          "vcard",
          [
            ["version", {}, "text", "4.0"],
            ["fn", {}, "text", "Example Org"],
          ],
        ],
      },
    ],
  };
  assert.equal(trimRecord(record).name, "Example Org");
});

test("jCard without fn, or malformed, yields null name", () => {
  assert.equal(trimRecord({ entities: [{ vcardArray: ["vcard", [["version", {}, "text", "4.0"]]] }] }).name, null);
  assert.equal(trimRecord({ entities: [{ vcardArray: ["vcard", "junk"] }] }).name, null);
  assert.equal(trimRecord({ entities: [{ vcardArray: ["vcard", [["fn", {}, "text", 7]]] }] }).name, null);
});

test("hex-only words and out-of-range IPv4 are not IP addresses", () => {
  for (const q of ["cafe", "deadbeef", "999.1.1.1", "256.0.0.1", "1.2.3", "1.2.3.4.5", ":::", "1::2::3"]) {
    assert.notEqual(kindOf(q), "ip", q);
  }
});

test("valid IPv4/IPv6 still classify as ip", () => {
  for (const q of ["0.0.0.0", "255.255.255.255", "8.8.8.8", "::1", "2001:db8::1", "fe80::1", "::ffff:192.0.2.1"]) {
    assert.equal(kindOf(q), "ip", q);
  }
});

test("AS-prefixed ASNs are autnum and map to the bare number", () => {
  for (const [q, n] of [["AS15169", "15169"], ["as15169", "15169"], ["ASN15169", "15169"], ["asn:15169", "15169"], ["15169", "15169"]]) {
    assert.equal(kindOf(q), "autnum", q);
    assert.equal(rdap.asnNumber?.(q), n, `asnNumber(${q})`);
  }
  assert.equal(kindOf("AS"), null);
  assert.equal(kindOf("4294967296"), null, "beyond 32-bit ASN range");
});
