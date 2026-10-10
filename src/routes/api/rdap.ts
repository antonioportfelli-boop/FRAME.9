import { createFileRoute } from "@tanstack/react-router";

const GAP_MS = 2000;
let lastLookup = 0;

function kindOf(query: string): "ip" | "domain" | "autnum" | null {
  if (/^(?:asn:)?\d{1,10}$/i.test(query)) return "autnum";
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(query) || /^[0-9a-f:]+$/i.test(query)) return "ip";
  if (/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(query)) return "domain";
  return null;
}

function textOf(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 180);
  return null;
}

function trimRecord(body: unknown): Record<string, string | null> {
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

export const Route = createFileRoute("/api/rdap")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 253) ?? "";
        const kind = kindOf(query);
        if (!kind) {
          return Response.json(
            { source: "OPEN_DATA_RDAP", error: "Enter an IP address, domain, or ASN." },
            { status: 400 },
          );
        }
        const now = Date.now();
        if (now - lastLookup < GAP_MS) {
          return Response.json(
            { source: "OPEN_DATA_RDAP", error: "Wait a moment before another lookup." },
            { status: 429 },
          );
        }
        lastLookup = now;
        const path =
          kind === "autnum"
            ? `https://rdap.org/autnum/${query.replace(/^asn:/i, "")}`
            : `https://rdap.org/${kind}/${encodeURIComponent(query)}`;
        try {
          const response = await fetch(path, { signal: AbortSignal.timeout(8000) });
          if (!response.ok) {
            return Response.json(
              {
                source: "OPEN_DATA_RDAP",
                query,
                kind,
                error: `Registry returned ${response.status}. No registrant was invented.`,
              },
              { status: 502 },
            );
          }
          const record = trimRecord(await response.json());
          return Response.json({
            source: "OPEN_DATA_RDAP",
            query,
            kind,
            retrievedAt: new Date().toISOString(),
            claim: "ADDRESS_REGISTRANT",
            notOwner: "This registry record is not a device owner.",
            record,
          });
        } catch {
          return Response.json(
            { source: "OPEN_DATA_RDAP", query, kind, error: "Lookup failed or timed out." },
            { status: 502 },
          );
        }
      },
    },
  },
});
