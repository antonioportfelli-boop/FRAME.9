// F04-03: repository docs point at the real repo and branch model.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** Read repository documentation as UTF-8 for source-reference assertions. */
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const DOCS = ["README.md", "REMIX.md", "CODEBASE_MAP.md", "AGENTS.md"];

test("no doc points at the never-created lunar-kite-nova-light GitHub repo", () => {
  for (const doc of DOCS) {
    assert.doesNotMatch(read(doc), /github\.com\/[^\s)]*lunar-kite-nova-light/, doc);
    assert.doesNotMatch(read(doc), /repository does not exist yet/i, doc);
  }
});

test("REMIX names the FRAME.9 repo and both branches", () => {
  const remix = read("REMIX.md");
  assert.match(remix, /https:\/\/github\.com\/antonioportfelli-boop\/FRAME\.9/);
  assert.match(remix, /`main`/);
  assert.match(remix, /`Forge\.-9`/);
});

test("README states the development branch and CI workflow", () => {
  const readme = read("README.md");
  assert.match(readme, /Forge\.-9/);
  assert.match(readme, /\.github\/workflows\/ci\.yml/);
});
