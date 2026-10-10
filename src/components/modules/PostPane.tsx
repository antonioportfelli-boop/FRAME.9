import { useState } from "react";
import { judge, mintSlip, type Slip, type Verdict } from "@/lib/signal/post";

export function PostPane() {
  const [local, setLocal] = useState("frame9");
  const [domain, setDomain] = useState("local.test");
  const [note, setNote] = useState("");
  const [slips, setSlips] = useState<Slip[]>([]);
  const [raw, setRaw] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col bg-ink">
      <div className="border-b border-line px-4 py-4">
        <p className="font-mono text-[10px] tracking-[0.22em] text-brass">POST · VASTUS</p>
        <p className="mt-2 text-sm text-fg">Kleebitud kiri seotakse ainult siis, kui aadressil on selle lehe sedel.</p>
        <p className="mt-1 text-xs text-muted">See aken ei saada ega võta kirju vastu. Võõras tekst jääb siia.</p>
      </div>
      <div className="flex flex-col gap-3 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-2">
          <input value={local} onChange={(event) => setLocal(event.target.value)} className="h-11 border border-line bg-surface px-3 font-mono text-xs outline-none" aria-label="Kohalik osa" />
          <input value={domain} onChange={(event) => setDomain(event.target.value)} className="h-11 border border-line bg-surface px-3 font-mono text-xs outline-none" aria-label="Domeen" />
        </div>
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Sedeli märkus" className="h-11 border border-line bg-surface px-3 text-sm outline-none" />
        <button
          type="button"
          className="h-11 border border-teal text-sm text-teal"
          onClick={() => {
            const slip = mintSlip(local, domain, note);
            if (!slip) {
              setWarn("Aadressi osad ei kõlba.");
              return;
            }
            setSlips((list) => [slip, ...list].slice(0, 12));
            setWarn(null);
          }}
        >
          Uus sedel
        </button>
        {warn ? <p className="text-xs text-brass">{warn}</p> : null}
        {slips.map((slip) => (
          <p key={slip.token} className="break-all border border-line px-3 py-2 font-mono text-[11px] text-muted">
            {slip.address}
            {slip.note ? ` · ${slip.note}` : ""}
          </p>
        ))}
        <textarea
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder="Kleebi kirja tekst"
          className="min-h-36 border border-line bg-surface p-3 font-mono text-xs outline-none"
        />
        <button type="button" className="h-11 border border-line text-sm text-fg" onClick={() => setVerdict(judge(raw, local, domain, slips))}>
          Seo
        </button>
        {verdict ? (
          <div className="border border-line px-3 py-3">
            <p className={`text-sm ${verdict.kind === "kept" ? "text-teal" : "text-brass"}`}>{verdict.line}</p>
            {verdict.kind === "kept" ? (
              <>
                <p className="mt-2 font-mono text-[11px] text-muted">{verdict.from}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs text-fg">{verdict.body}</p>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
