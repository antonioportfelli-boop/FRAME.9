/**
 * Outbound request to the public RDAP bootstrap (rdap.org). rdap.org sits
 * behind Cloudflare, which answers Node's default `fetch` User-Agent ("node")
 * with 403; an explicit, descriptive User-Agent and the RDAP media type are
 * accepted (302 to the registry). See scripts/rdap-fetch.test.mjs.
 */
export const RDAP_USER_AGENT =
  "FRAME.9-rdap-lookup/1.0 (+https://github.com/antonioportfelli-boop/FRAME.9)";

export const RDAP_REQUEST_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  "user-agent": RDAP_USER_AGENT,
  accept: "application/rdap+json, application/json;q=0.9",
});

export const RDAP_TIMEOUT_MS = 8000;

/** Fetch an RDAP URL with registry headers and an eight-second timeout signal. */
export function fetchRdap(url: string, fetchImpl: typeof fetch = fetch): Promise<Response> {
  return fetchImpl(url, {
    headers: { ...RDAP_REQUEST_HEADERS },
    signal: AbortSignal.timeout(RDAP_TIMEOUT_MS),
  });
}
