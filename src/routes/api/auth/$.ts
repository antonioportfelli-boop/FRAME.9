import { createFileRoute } from "@tanstack/react-router";
import { authRouteEnabled, handleAuthRoute } from "@/lib/auth/auth-route";

/** Dispatch auth requests, loading Better Auth only when authentication is on. */
function serve({ request }: { request: Request }): Promise<Response> {
  return handleAuthRoute(request, {
    enabled: authRouteEnabled(process.env.VITE_AUTH_ENABLED),
    /** Load the existing server handler without initializing it for disabled auth. */
    load: async () => (await import("@/lib/auth/server")).auth.handler,
  });
}

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: serve, POST: serve } },
});
