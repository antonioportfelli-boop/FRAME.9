import { createFileRoute } from "@tanstack/react-router";
import { authRouteEnabled, handleAuthRoute } from "@/lib/auth/auth-route";

// Mounts the existing Better Auth instance (`@/lib/auth/server`) at
// `/api/auth/*`, the path `client.ts` already talks to. Gated by the same
// VITE_AUTH_ENABLED flag; the server module is loaded only when auth is on.
function serve({ request }: { request: Request }): Promise<Response> {
  return handleAuthRoute(request, {
    enabled: authRouteEnabled(process.env.VITE_AUTH_ENABLED),
    load: async () => (await import("@/lib/auth/server")).auth.handler,
  });
}

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: serve, POST: serve } },
});
