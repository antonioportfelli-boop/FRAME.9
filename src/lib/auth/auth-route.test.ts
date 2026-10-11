import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authRouteEnabled, handleAuthRoute } from "./auth-route.ts";

const req = () => new Request("http://localhost:8080/api/auth/get-session");

describe("authRouteEnabled (same predicate as server.ts)", () => {
  it("is off only for exactly 'false' (trimmed)", () => {
    assert.equal(authRouteEnabled("false"), false);
    assert.equal(authRouteEnabled("  false "), false);
  });
  it("is on when unset, empty or any other value", () => {
    for (const v of [undefined, "", "true", "FALSE", "0"]) {
      assert.equal(authRouteEnabled(v), true, String(v));
    }
  });
});

describe("handleAuthRoute", () => {
  it("flag off -> 404 and never loads the auth server", async () => {
    let loaded = false;
    const res = await handleAuthRoute(req(), {
      enabled: false,
      load: async () => {
        loaded = true;
        return async () => new Response("leak", { status: 200 });
      },
    });
    assert.equal(res.status, 404);
    assert.equal(loaded, false);
  });
  it("flag on -> delegates the unmodified request to Better Auth", async () => {
    const request = req();
    let seen: Request | null = null;
    const res = await handleAuthRoute(request, {
      enabled: true,
      load: async () => async (r) => {
        seen = r;
        return new Response(null, { status: 401 });
      },
    });
    assert.equal(seen, request);
    assert.equal(res.status, 401);
  });
});
