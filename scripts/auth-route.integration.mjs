// F02-02 integration check against the BUILT server (`npm run build` first;
// CI runs it after BUILD). Exercises the real Better Auth instance mounted at
// /api/auth/* — no mocks. Run: npm run test:auth-route
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, ".vercel/output/functions/__server.func/index.mjs");
const ORIGIN = "http://localhost:8080";

// Deployed mode: the deployer always injects DATABASE_URL with auth. Point it at
// a closed port so ANY database query on these paths fails loudly (500 or
// unhandled rejection) — the denials below must come from Better Auth itself.
// (Without DATABASE_URL the built output falls back to PGLite, whose data files
// are not traced into .vercel/output — tracked separately as baseline debt.)
assert.ok(process.env.DATABASE_URL, "CI must provide an isolated PostgreSQL DATABASE_URL");

test("route is registered in the generated route tree", () => {
  assert.ok(existsSync(join(root, "src/routes/api/auth/$.ts")));
  const tree = readFileSync(join(root, "src/routeTree.gen.ts"), "utf8");
  assert.match(tree, /'\/api\/auth\/\$'/);
});

test("built server", async (t) => {
  assert.ok(existsSync(entry), "run `npm run build` first");
  const app = (await import(pathToFileURL(entry).href)).default;
  /** Send an HTTP request directly through the built server's fetch handler. */
  const call = (path, init = {}) => app.fetch(new Request(ORIGIN + path, init));

  await t.test("flag off (VITE_AUTH_ENABLED=false) -> every /api/auth path is 404", async () => {
    process.env.VITE_AUTH_ENABLED = "false";
    try {
      for (const p of ["/api/auth/ok", "/api/auth/get-session", "/api/auth/list-sessions"]) {
        const res = await call(p);
        assert.equal(res.status, 404, p);
        assert.deepEqual(await res.json(), { error: "Authentication is disabled." });
      }
    } finally {
      delete process.env.VITE_AUTH_ENABLED;
    }
  });

  await t.test("flag on -> Better Auth answers (route present)", async () => {
    const res = await call("/api/auth/ok");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
  });

  await t.test("unauthenticated -> no session, protected data denied", async () => {
    const session = await call("/api/auth/get-session");
    assert.equal(session.status, 200);
    assert.equal(await session.json(), null);

    const anon = await call("/api/auth/list-sessions");
    assert.equal(anon.status, 401);

    const forgedCookie = await call("/api/auth/list-sessions", {
      headers: { cookie: "__Host-grok-auth.session_token=forged.token" },
    });
    assert.equal(forgedCookie.status, 401);

    const forgedBearer = await call("/api/auth/list-sessions", {
      headers: { authorization: "Bearer forged.token" },
    });
    assert.equal(forgedBearer.status, 401);
  });
});
