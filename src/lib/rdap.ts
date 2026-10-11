/**
 * Pure helpers for the public RDAP lookup (`src/routes/api/rdap.ts`), split out
 * so they can be unit-tested (scripts/rdap.test.mjs). Behaviour unchanged.
 */
export function kindOf(query: string): "ip" | "domain" | "autnum" | null {
  if (/^(?:asn:)?\d{1,10}$/i.test(query)) return "autnum";
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(query) || /^[0-9a-f:]+$/i.test(query)) return "ip";
const ASN_PATTERN = /^(?:asn:?|as)?(\d{1,10})$/i;
const MAX_ASN = 4294967295;

/** Bare ASN digits for an autnum query ("AS15169", "asn:15169", "15169"), else null. */
export function asnNumber(query: string): string | null {
  const match = ASN_PATTERN.exec(query);
  if (!match || Number(match[1]) > MAX_ASN) return null;
  return match[1];
}

function isIPv4(query: string): boolean {
  const parts = query.split(".");
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

/** IPv6 needs a colon; the WHATWG URL parser then validates the full grammar. */
function isIPv6(query: string): boolean {
  if (!query.includes(":") || !/^[0-9a-f:.]+$/i.test(query)) return false;
  try {
    new URL(`http://[${query}]/`);
    return true;
  } catch {
    return false;
  }
}

export function kindOf(query: string): "ip" | "domain" | "autnum" | null {
  if (asnNumber(query) !== null) return "autnum";
  if (isIPv4(query) || isIPv6(query)) return "ip";
  if (/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(query)) return "domain";
  return null;
}

export function textOf(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 180);
  return null;
}

export function trimRecord(body: unknown): Record<string, string | null> {
  const row = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const vcard = Array.isArray(row.entities) ? row.entities[0] : null;
  const card = vcard && typeof vcard === "object" ? (vcard as Record<string, unknown>).vcardArray : null;
  let name: string | null = null;
  if (Array.isArray(card)) {
    for (const item of card) {
  // RFC 7095 jCard: ["vcard", [[name, params, type, value], ...]]. The flat
  // property list is still accepted for older/non-conforming responses.
  const props = Array.isArray(card) && card[0] === "vcard" ? card[1] : card;
  if (Array.isArray(props)) {
    for (const item of props) {
      if (Array.isArray(item) && item[0] === "fn" && typeof item[3] === "string") name = item[3].slice(0, 180);
    }
  }
  return {
    name: textOf(row.name) ?? textOf(row.ldhName) ?? name,
    handle: textOf(row.handle),
    type: textOf(row.type),
    country: textOf(row.country),
    startAddress: textOf(row.startAddress),
    endAddress: textOf(row.endAddress),
  };
}
