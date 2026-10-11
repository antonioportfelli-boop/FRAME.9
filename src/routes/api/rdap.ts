import { createFileRoute } from "@tanstack/react-router";
import { asnNumber, kindOf, trimRecord } from "@/lib/rdap";

const GAP_MS = 2000;
let lastLookup = 0;

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
            ? `https://rdap.org/autnum/${asnNumber(query)}`
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
