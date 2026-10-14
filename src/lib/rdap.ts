/**
 * Pure helpers for the public RDAP lookup (src/routes/api/rdap.ts).
 * Parsed inputs are not trusted: avoid registry calls for malformed IP/ASN values.
 */
const ASN_PATTERN = /^(?:asn:?|as)?(\d{1,10})$/i;
const MAX_ASN = 4294967295;

/** Bare ASN digits for an autnum query ("AS15169", "asn:15169", "15169"), else null. */
export function asnNumber(query: string): string | null {
  const match = ASN_PATTERN.exec(query);
  if (!match || Number(match[1]) > MAX_ASN) return null;
  return match[1];
}

/** Accept four decimal IPv4 octets, each in the range 0..255. */
function isIPv4(query: string): boolean {
  const parts = query.split(".");
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

/** IPv6 needs a colon; WHATWG URL parser validates the complete grammar. */
function isIPv6(query: string): boolean {
  if (!query.includes(":") || !/^[0-9a-f:.]+$/i.test(query)) return false;
  try {
    new URL("http://[" + query + "]/");
    return true;
  } catch {
    return false;
  }
}

/** Classify an RDAP query, returning null for unsupported or malformed input. */
export function kindOf(query: string): "ip" | "domain" | "autnum" | null {
  if (asnNumber(query) !== null) return "autnum";
  if (isIPv4(query) || isIPv6(query)) return "ip";
  if (/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(query)) return "domain";
  return null;
}

/** Trim a nonblank string to 180 characters, returning null for other values. */
export function textOf(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 180);
  return null;
}

/** Extract bounded registrant fields, with a first-entity vCard name fallback. */
export function trimRecord(body: unknown): Record<string, string | null> {
  const row = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const vcard = Array.isArray(row.entities) ? row.entities[0] : null;
  const card = vcard && typeof vcard === "object" ? (vcard as Record<string, unknown>).vcardArray : null;
  let name: string | null = null;
  // RFC 7095 jCard: ["vcard", [[name, params, type, value], ...]].
  // Accept legacy flat property lists as well.
  const props = Array.isArray(card) && card[0] === "vcard" ? card[1] : card;
  if (Array.isArray(props)) {
    for (const item of props) {
      if (Array.isArray(item) && item[0] === "fn" && typeof item[3] === "string") {
        name = item[3].slice(0, 180);
      }
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
