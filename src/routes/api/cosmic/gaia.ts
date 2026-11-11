import { createFileRoute } from "@tanstack/react-router";
import { GaiaArchiveError, refreshGaiaDr3Snapshot } from "@/lib/cosmic/gaia-dr3-archive.server";

export const Route = createFileRoute("/api/cosmic/gaia")({
  server: {
    handlers: {
      /** Fixed Gaia DR3 query only. No client SQL, URL, or table name is accepted. */
      POST: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const origin = request.headers.get("origin");
        const fetchSite = request.headers.get("sec-fetch-site");
        if (!origin || origin !== requestUrl.origin || fetchSite === "cross-site") {
          return Response.json(
            { error: { code: "ORIGIN_REJECTED", message: "Gaia Archive checks must be started from this FRAME.9 page." } },
            { status: 403, headers: { "Cache-Control": "no-store" } },
          );
        }
        try {
          const result = await refreshGaiaDr3Snapshot();
          return Response.json(result, {
            headers: { "Cache-Control": "no-store" },
          });
        } catch (error) {
          const failure = error instanceof GaiaArchiveError
            ? error
            : new GaiaArchiveError("ARCHIVE_UNAVAILABLE", "Gaia Archive refresh failed; the prior snapshot was kept.", 502);
          return Response.json(
            { error: { code: failure.code, message: failure.message } },
            {
              status: failure.status,
              headers: {
                "Cache-Control": "no-store",
                ...(failure.status === 429 ? { "Retry-After": "15" } : {}),
              },
            },
          );
        }
      },
    },
  },
});
