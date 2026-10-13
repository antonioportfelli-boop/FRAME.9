/**
 * Where the Source / Remix pane points. One constant per fact so the branch
 * can change in one place. SOURCE_BRANCH is the stable branch the public
 * download serves (`main`); development happens on Forge.-9.
 */
export const SOURCE_REPO = "https://github.com/antonioportfelli-boop/FRAME.9";
export const SOURCE_BRANCH = "main";
export const DEVELOPMENT_BRANCH = "Forge.-9";

export const CLONE_COMMAND = `git clone ${SOURCE_REPO}.git`;

/** GitHub ZIP archive URL for a branch (branch name path-encoded). */
export function archiveUrl(branch: string = SOURCE_BRANCH): string {
  return `${SOURCE_REPO}/archive/refs/heads/${encodeURIComponent(branch)}.zip`;
}

export const FORK_URL = `${SOURCE_REPO}/fork`;
