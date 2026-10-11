/**
 * Pure helpers for the public RDAP lookup (`src/routes/api/rdap.ts`), split out
 * so they can be unit-tested (scripts/rdap.test.mjs). Behaviour unchanged.
 */
export function kindOf(query: string): "ip" | "domain" | "autnum" | null {
  if (/^(?:asn:)?\d{1,10}$/i.test(query)) return "autnum";
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(query) || /^[0-9a-f:]+$/i.test(query)) return "ip";
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
