// F03-01: desk window layout (src/lib/signal/store.ts) — defaultWindows and
// clampWin. store.ts uses the `@/` alias, resolved by ./alias-hooks.mjs.
import { register } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";

register("./alias-hooks.mjs", import.meta.url);
const { defaultWindows, clampWin } = await import("../src/lib/signal/store.ts");
const { MODULES } = await import("../src/lib/signal/types.ts");

test("defaultWindows returns one window per module, unique ids, z = 1..n", () => {
  for (const [vw, vh] of [[390, 844], [1280, 800], [1920, 1080]]) {
    const wins = defaultWindows(vw, vh);
    assert.equal(wins.length, MODULES.length);
    assert.deepEqual(wins.map((w) => w.id), MODULES.map((m) => m.id));
    assert.deepEqual(wins.map((w) => w.z), MODULES.map((_, i) => i + 1));
    assert.ok(wins.every((w) => !w.minimized));
  }
});

test("narrow viewport (<800): everything closed, full-width column", () => {
  const wins = defaultWindows(390, 844);
  assert.ok(wins.every((w) => !w.open && w.x === 8 && w.y === 168 && w.w === 374));
  assert.ok(wins.every((w) => w.h === 844 - 168 - 76));
  // Minimums hold on tiny screens.
  const tiny = defaultWindows(120, 300);
  assert.ok(tiny.every((w) => w.w === 200 && w.h === 280));
});

test("wide viewport: only frames opens, and windows fit horizontally", () => {
  const vw = 1280;
  const wins = defaultWindows(vw, 800);
  assert.deepEqual(wins.filter((w) => w.open).map((w) => w.id), ["frames"]);
  for (const w of wins) {
    assert.ok(w.w <= vw - 16, `${w.id} width`);
    assert.ok(w.x >= 8 && w.x + w.w <= vw - 8, `${w.id} x-range`);
  }
});

const base = { id: "frames", title: "Frames", open: true, minimized: false, x: 10, y: 10, w: 400, h: 300, z: 1 };

test("clampWin keeps an in-bounds window unchanged", () => {
  assert.deepEqual(clampWin(base, 1280, 800), base);
});

test("clampWin pulls off-screen windows back and caps size", () => {
  const r = clampWin({ ...base, x: 5000, y: -50, w: 5000, h: 5000 }, 1280, 800);
  assert.equal(r.x, 1280 - 48);
  assert.equal(r.y, 0);
  assert.equal(r.w, 1280 - 8);
  assert.equal(r.h, 800 - 48);
});

test("clampWin enforces minimum 200x160 and non-negative position", () => {
  const r = clampWin({ ...base, x: -10, w: 10, h: 10 }, 100, 100);
  assert.equal(r.w, 200);
  assert.equal(r.h, 160);
  assert.equal(r.x, 0);
  assert.ok(r.y >= 0);
});
