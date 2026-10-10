import { createFileRoute } from "@tanstack/react-router";

function publicAddress(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim() ?? "";
  if (!first || first.length > 64) return null;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|172\.(1[6-9]|2\d|3[01])\.)/.test(first)) return null;
  if (/^(::1|fc|fd|fe80)/i.test(first)) return null;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(first) || /^[0-9a-f:]+$/i.test(first)) return first;
  return null;
}

export const Route = createFileRoute("/api/host-address")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const address =
          publicAddress(request.headers.get("x-forwarded-for")) ??
          publicAddress(request.headers.get("x-real-ip"));
        return Response.json({
          address,
          port: 51820,
          note: address
            ? "See on selle ühenduse avalik aadress. Kontrolli, et ruuter suunab UDP 51820 just sellele arvutile."
            : "Avalikku aadressi päises ei ole. Kirjuta see ise.",
        });
      },
    },
  },
});
