// F04-01: SourcePane links come from one branch constant (src/lib/source.ts).
// Imports the .ts directly (Node >=22.18 strips types; CI uses .nvmrc 22).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CLONE_COMMAND,
  DEVELOPMENT_BRANCH,
  FORK_URL,
  SOURCE_BRANCH,
  SOURCE_REPO,
  archiveUrl,
} from "../src/lib/source.ts";

test("stable download branch is main; development branch is Forge.-9", () => {
  assert.equal(SOURCE_BRANCH, "main");
  assert.equal(DEVELOPMENT_BRANCH, "Forge.-9");
});

test("links derive from the repo + branch constants", () => {
  assert.equal(SOURCE_REPO, "https://github.com/antonioportfelli-boop/FRAME.9");
  assert.equal(archiveUrl(), `${SOURCE_REPO}/archive/refs/heads/main.zip`);
  assert.equal(archiveUrl(DEVELOPMENT_BRANCH), `${SOURCE_REPO}/archive/refs/heads/Forge.-9.zip`);
  assert.equal(archiveUrl("a/b"), `${SOURCE_REPO}/archive/refs/heads/a%2Fb.zip`);
  assert.equal(CLONE_COMMAND, `git clone ${SOURCE_REPO}.git`);
  assert.equal(FORK_URL, `${SOURCE_REPO}/fork`);
});

test("SourcePane no longer hard-codes a branch or the repo URL", () => {
  const pane = readFileSync(new URL("../src/components/modules/SourcePane.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(pane, /main\.zip|github\.com/);
  assert.match(pane, /archiveUrl\(\)/);
});
