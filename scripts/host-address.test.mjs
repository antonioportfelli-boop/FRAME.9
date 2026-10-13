// F06-02: publicAddress (src/lib/host-address.ts) — which proxy-header value
// /api/host-address reports. Asserts intended behaviour; gaps are in the PR.
import { test } from "node:test";
import assert from "node:assert/strict";
import { publicAddress } from "../src/lib/host-address.ts";

test("returns public IPv4/IPv6 unchanged", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "203.0.113.7", "2001:db8::1", "2a00:1450:4001::200e"]) {
    assert.equal(publicAddress(ip), ip);
  }
});

test("rejects RFC1918, loopback, link-local, CGNAT and 0/8 IPv4", () => {
  for (const ip of [
    "10.0.0.1", "172.16.0.1", "172.31.255.255", "192.168.1.1",
    "127.0.0.1", "169.254.1.1", "100.64.0.1", "100.127.255.255", "0.1.2.3",
  ]) {
    assert.equal(publicAddress(ip), null, ip);
  }
});

test("keeps boundaries just outside the private ranges", () => {
  for (const ip of ["172.15.0.1", "172.32.0.1", "100.63.255.255", "100.128.0.1", "11.0.0.1"]) {
    assert.equal(publicAddress(ip), ip, ip);
  }
});

test("rejects IPv6 loopback, ULA and fe80 link-local", () => {
  for (const ip of ["::1", "fc00::1", "fd12:3456::1", "fe80::1", "FE80::abcd"]) {
    assert.equal(publicAddress(ip), null, ip);
  }
});

test("uses only the first x-forwarded-for hop, trimmed", () => {
  assert.equal(publicAddress(" 8.8.8.8 , 10.0.0.1"), "8.8.8.8");
  assert.equal(publicAddress("10.0.0.1, 8.8.8.8"), null);
});

test("rejects empty, oversize and non-address values", () => {
  for (const v of [null, "", " , ", "example.com", "8.8.8.8:443", "x".repeat(65), "<script>"]) {
    assert.equal(publicAddress(v), null, String(v));
  }
});
