import { createFileRoute } from "@tanstack/react-router";
import { publicAddress } from "@/lib/host-address";

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
