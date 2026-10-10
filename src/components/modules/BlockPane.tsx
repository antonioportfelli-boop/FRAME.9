import { useState } from "react";
import { browserName, useBlock } from "@/lib/signal/block";
import { browserWindowFrame } from "@/lib/signal/frames";
import { useDesk } from "@/lib/signal/store";

export function BlockPane() {
  const enabled = useBlock((s) => s.enabled);
  const mode = useBlock((s) => s.mode);
  const seed = useBlock((s) => s.seed);
  const blocked = useBlock((s) => s.blocked);
  const allowed = useBlock((s) => s.allowed);
  const watched = useBlock((s) => s.watched);
  const hits = useBlock((s) => s.hits);
  const [url, setUrl] = useState("https://example.com");
  const [host, setHost] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const running = browserName();

  function openWindow() {
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      setNote("See aadress ei ole URL.");
      return;
    }
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      setNote("Ainult http või https.");
      return;
    }
    const child = window.open(target.href, "frame9-window", "popup,width=960,height=720");
    if (!child) {
      setNote("Brauser blokeeris akna. Luba hüpikaken.");
      return;
    }
    const desk = useDesk.getState();
    const rel = desk.session ? (performance.now() - desk.session.startedAt) / 1000 : 0;
    desk.pushFrame(browserWindowFrame(rel, running, target.href));
    setNote(`${running} avas akna. See ei ole eraldi Chrome ega tunnel.`);
  }

  function probe() {
    void fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js").then((response) => {
      setNote(response.status === 403 ? "Proov peatati enne võrku minekut." : `Vastus ${response.status}.`);
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-3 py-3">
        <p className="text-sm text-fg">9block on selle lehe tulemüür. See ei ole viirusetõrje ega arvuti tulemüür.</p>
        <p className="mt-2 text-xs text-muted">Kinni jäävad ainult selle lehe fetch ja sendBeacon. Pilti ja teise lehe skripti see ei pea. Oma aadress jääb alati lahti.</p>
      </div>
      <div className="flex flex-col gap-2 border-b border-line p-3">
        <input value={url} onChange={(event) => setUrl(event.target.value)} className="h-11 border border-line bg-ink px-3 font-mono text-xs text-fg outline-none" />
        <button type="button" className="h-11 border border-teal text-sm text-teal" onClick={openWindow}>
          Ava aken
        </button>
        <button type="button" className="h-11 border border-line text-xs text-fg" onClick={() => useDesk.getState().openModule("wire")}>
          Ava Wire
        </button>
        {note ? <p className="text-xs text-muted">{note}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-2 border-b border-line p-3">
        <button type="button" className={`h-11 border text-xs ${!enabled ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => useBlock.getState().choose("off")}>
          Väljas
        </button>
        <button type="button" className={`h-11 border text-xs ${enabled && mode === "observe" ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => useBlock.getState().choose("observe")}>
          Pehme
        </button>
        <button type="button" className={`h-11 border text-xs ${enabled && mode === "list" ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => useBlock.getState().choose("list")}>
          Nimekiri
        </button>
        <button type="button" className={`h-11 border text-xs ${enabled && mode === "strict" ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => useBlock.getState().choose("strict")}>
          Võõras kinni
        </button>
        <button type="button" className={`h-11 border text-xs ${seed ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => useBlock.getState().setSeed(true)}>
          Seemnega
        </button>
        <button type="button" className={`h-11 border text-xs ${!seed ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => useBlock.getState().setSeed(false)}>
          Ilma seemneta
        </button>
      </div>
      <p className="border-b border-line px-3 py-2 text-xs text-muted">64 olekut: 4 režiimi korda 2 seemet korda 2 päritolu korda 2 beaconit korda 2 tundmatut. Kasutusel on neli, mis lehte ei lõhu. Ülejäänud 60 jätan tegemata: need kas sulgevad lehe enda või ei muuda midagi. 2500 olekut siin ei ole.</p>
      <div className="border-b border-line p-3">
        <button type="button" className="h-11 w-full border border-line text-xs text-fg" onClick={probe}>
          Proovi reklaami
        </button>
      </div>
      <form
        className="flex gap-2 border-b border-line p-3"
        onSubmit={(event) => {
          event.preventDefault();
          useBlock.getState().addBlocked(host);
          setHost("");
        }}
      >
        <input value={host} onChange={(event) => setHost(event.target.value)} placeholder="host.example" className="h-11 min-w-0 flex-1 border border-line bg-ink px-3 font-mono text-xs outline-none" />
        <button type="submit" className="h-11 border border-line px-3 text-xs">
          Blokeeri
        </button>
        <button
          type="button"
          className="h-11 border border-line px-3 text-xs"
          onClick={() => {
            useBlock.getState().addAllowed(host);
            setHost("");
          }}
        >
          Luba
        </button>
      </form>
      <div className="grid min-h-0 flex-1 grid-cols-2">
        <div className="overflow-auto border-r border-line">
          <p className="px-3 py-2 font-mono text-xs text-teal">Block</p>
          {blocked.map((item) => (
            <p key={item} className="truncate border-b border-line px-3 py-1 font-mono text-xs text-muted">{item}</p>
          ))}
          {allowed.length ? <p className="px-3 py-2 font-mono text-xs text-teal">Allow</p> : null}
          {allowed.map((item) => (
            <p key={item} className="truncate border-b border-line px-3 py-1 font-mono text-xs text-muted">{item}</p>
          ))}
          {watched.length ? <p className="px-3 py-2 font-mono text-xs text-brass">Watch</p> : null}
          {watched.map((item) => (
            <p key={item} className="truncate border-b border-line px-3 py-1 font-mono text-xs text-muted">{item}</p>
          ))}
        </div>
        <div className="overflow-auto">
          <p className="px-3 py-2 font-mono text-xs text-teal">Live</p>
          {hits.length === 0 ? <p className="px-3 py-2 text-xs text-muted">Selle lehe kõrvalisi ühendusi pole veel näha.</p> : null}
          {hits.map((hit, index) => (
            <p key={`${hit.at}-${hit.host}-${index}`} className="border-b border-line px-3 py-1 font-mono text-xs text-muted">
              <span className={hit.action === "blocked" ? "text-brass" : "text-teal"}>{hit.action}</span> {hit.host}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
