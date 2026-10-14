// F02-01: the sign-in route that `gates.tsx` (SIGN_IN_PATH / RedirectToSignIn)
// points at must exist and be built from the existing auth gates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
/** Read route source as UTF-8 relative to the repository root. */
const read = (p) => readFileSync(join(root, p), "utf8");

test("SIGN_IN_PATH is /login and the route tree registers it", () => {
  assert.match(read("src/lib/auth/gates.tsx"), /export const SIGN_IN_PATH = "\/login";/);
  assert.match(read("src/routeTree.gen.ts"), /path: '\/login'/);
});

test("login route reuses SignInGate + SignInButtons and honours the auth flag", () => {
  const src = read("src/routes/login.tsx");
  assert.match(src, /createFileRoute\("\/login"\)/);
  assert.match(src, /<SignInGate fallback=\{<SignInButtons \/>\}>/);
  assert.match(src, /authEnabled \?/);
  // No credentials or provider config are defined on the page itself.
  assert.doesNotMatch(src, /secret|clientId|PREVIEW_/i);
});
