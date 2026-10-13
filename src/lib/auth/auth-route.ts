/**
 * `/api/auth/*` dispatch, kept free of server imports so it is unit-testable
 * (`auth-route.test.ts`). The route file supplies the flag and a lazy loader
 * for the existing Better Auth instance in `./server` — config is not touched
 * here, only whether the handler is reachable.
 */
export type AuthHandler = (request: Request) => Promise<Response>;

/**
 * Same predicate as `server.ts` / `gate-identity.server.ts`: auth is off only
 * when `VITE_AUTH_ENABLED` is exactly "false" (whitespace-trimmed).
 */
export function authRouteEnabled(flag: string | undefined): boolean {
  return flag?.trim() !== "false";
}

/** Flag off -> 404 without loading the auth server; flag on -> Better Auth. */
export async function handleAuthRoute(
  request: Request,
  options: { enabled: boolean; load: () => Promise<AuthHandler> },
): Promise<Response> {
  if (!options.enabled) {
    return Response.json({ error: "Authentication is disabled." }, { status: 404 });
  }
  const handler = await options.load();
  return handler(request);
}
