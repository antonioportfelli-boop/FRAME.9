import { useState } from "react";
import {
  CLONE_COMMAND as CLONE,
  FORK_URL,
  SOURCE_BRANCH,
  SOURCE_REPO as REPO,
  archiveUrl,
} from "@/lib/source";

/** Show repository links, branch downloads, and a copyable clone command. */
export function SourcePane() {
  const [status, setStatus] = useState<string | null>(null);

  /** Copy the clone command and report success or a manual-copy fallback. */
  async function copyClone() {
    try {
      await navigator.clipboard.writeText(CLONE);
      setStatus("Kloonimiskäsk kopeeritud.");
    } catch {
      setStatus("Kopeerimine ei õnnestunud. Vali ja kopeeri käsk allpool.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-ink p-4">
      <h2 className="font-mono text-xs tracking-widest text-brass">SOURCE / REMIX</h2>
      <p className="mt-3 text-sm text-fg">FRAME.9 lähtekood ja muudatuste ajalugu asuvad GitHubis.</p>
      <p className="mt-2 break-all font-mono text-xs text-muted">{REPO}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a className="inline-flex min-h-11 items-center border border-teal px-3 text-xs text-teal" href={REPO} target="_blank" rel="noopener noreferrer">Open on GitHub</a>
        <a className="inline-flex min-h-11 items-center border border-line px-3 text-xs text-fg" href={archiveUrl()}>Download ZIP ({SOURCE_BRANCH})</a>
        <a className="inline-flex min-h-11 items-center border border-line px-3 text-xs text-fg" href={FORK_URL} target="_blank" rel="noopener noreferrer">Fork</a>
        <button type="button" className="min-h-11 border border-line px-3 text-xs text-fg" onClick={() => void copyClone()}>Copy clone</button>
      </div>
      <label htmlFor="source-clone" className="mt-5 text-xs text-muted">Kloonimiskäsk</label>
      <input id="source-clone" readOnly value={CLONE} className="mt-2 min-h-11 w-full border border-line bg-ink px-3 font-mono text-xs text-fg" />
      <p role="status" className="mt-3 text-xs text-muted">{status}</p>
    </div>
  );
}

