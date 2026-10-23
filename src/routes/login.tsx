import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { authEnabled } from "@/lib/auth/client";
import { SignInButtons, SignInGate } from "@/lib/auth/gates";

// Must stay a string literal for the route generator; equals SIGN_IN_PATH
// (asserted by scripts/login-route.test.mjs).
export const Route = createFileRoute("/login")({ component: LoginPage });

/**
 * Sign-in page at SIGN_IN_PATH, built from the existing auth gates: signed-out
 * visitors get SignInButtons, a signed-in visitor goes back to the desk, and
 * nothing renders while the session is still resolving (no signed-out flash).
 */
function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink p-6 text-fg">
      <h1 className="font-mono text-xs tracking-widest text-brass">FRAME.9 / SIGN IN</h1>
      {authEnabled ? (
        <SignInGate fallback={<SignInButtons />}>
          <Navigate to="/" />
        </SignInGate>
      ) : (
        <p className="max-w-sm text-center text-sm text-muted">
          Sign-in is turned off in this build.{" "}
          <Link to="/" className="text-teal underline-offset-4 hover:underline">
            Back to the desk
          </Link>
        </p>
      )}
    </main>
  );
}
