// F06-06: the RDAP fetch sends an explicit descriptive User-Agent and the RDAP
// media type (rdap.org/Cloudflare 403s Node's default "node" UA). Stubbed
// fetch only — the live check is PR evidence, not a CI dependency.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RDAP_USER_AGENT, RDAP_TIMEOUT_MS, fetchRdap } from "../src/lib/rdap-fetch.ts";

/** Create a successful fetch stub and a log of the requests it receives. */
function stub() {
  const calls = [];
  /** Capture a request and return an empty JSON response without network access. */
  const impl = async (url, init) => {
    calls.push({ url, init });
    return new Response("{}", { status: 200 });
  };
  return { calls, impl };
}

test("sends descriptive User-Agent and RDAP Accept header", async () => {
  const { calls, impl } = stub();
  await fetchRdap("https://rdap.org/ip/8.8.8.8", impl);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://rdap.org/ip/8.8.8.8");
  const headers = new Headers(calls[0].init.headers);
  assert.equal(headers.get("user-agent"), RDAP_USER_AGENT);
  assert.match(headers.get("user-agent"), /^FRAME\.9-rdap-lookup\/\d/);
  assert.match(headers.get("user-agent"), /\+https:\/\/github\.com\/antonioportfelli-boop\/FRAME\.9/);
  assert.doesNotMatch(headers.get("user-agent"), /^node$/i);
  assert.match(headers.get("accept"), /^application\/rdap\+json/);
});

test("keeps the timeout signal and sends no credentials or cookies", async () => {
  const { calls, impl } = stub();
  await fetchRdap("https://rdap.org/autnum/15169", impl);
  const { init } = calls[0];
  assert.ok(init.signal instanceof AbortSignal);
  assert.equal(RDAP_TIMEOUT_MS, 8000);
  const headers = new Headers(init.headers);
  for (const h of ["cookie", "authorization"]) assert.equal(headers.get(h), null, h);
});

test("each call gets a fresh headers object (shared constant is not mutated)", async () => {
  const { calls, impl } = stub();
  await fetchRdap("https://rdap.org/ip/1.1.1.1", impl);
  calls[0].init.headers["user-agent"] = "tampered";
  await fetchRdap("https://rdap.org/ip/1.1.1.1", impl);
  assert.equal(new Headers(calls[1].init.headers).get("user-agent"), RDAP_USER_AGENT);
});
