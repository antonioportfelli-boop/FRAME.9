import { useState } from "react";
import { useAccount } from "@/lib/signal/account";
import { useMemory } from "@/lib/signal/memory";
import { useDesk } from "@/lib/signal/store";

type Tool = { id: string; title: string; run: (text: string) => Promise<string> };

function hexOf(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const TOOLS: Tool[] = [
  { id: "local", title: "Aeg", run: async () => new Date().toString() },
  { id: "utc", title: "UTC", run: async () => new Date().toISOString() },
  { id: "zone", title: "Vöönd", run: async () => Intl.DateTimeFormat().resolvedOptions().timeZone },
  { id: "unix", title: "Unix", run: async () => String(Math.floor(Date.now() / 1000)) },
  { id: "sha", title: "SHA-256", run: async (text) => hexOf(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))) },
  { id: "b64", title: "Base64", run: async (text) => btoa(unescape(encodeURIComponent(text))) },
  { id: "b64d", title: "Base64 lahti", run: async (text) => { try { return decodeURIComponent(escape(atob(text.trim()))); } catch { return "See ei ole Base64."; } } },
  { id: "hex", title: "Hex", run: async (text) => hexOf(new TextEncoder().encode(text)) },
  { id: "hexd", title: "Hex lahti", run: async (text) => { try { const clean = text.replace(/\s+/g, ""); if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2) return "See ei ole paaris hex."; const bytes = new Uint8Array(clean.length / 2); for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16); return new TextDecoder().decode(bytes); } catch { return "Hex ei avanenud."; } } },
  { id: "rand", title: "16 baiti", run: async () => hexOf(crypto.getRandomValues(new Uint8Array(16))) },
  { id: "online", title: "Võrk", run: async () => (navigator.onLine ? "online" : "offline") },
  { id: "lang", title: "Keel", run: async () => navigator.language },
  { id: "screen", title: "Ekraan", run: async () => `${screen.width}×${screen.height}` },
  { id: "dpr", title: "Pikslid", run: async () => String(window.devicePixelRatio) },
  { id: "cores", title: "Tuumad", run: async () => String(navigator.hardwareConcurrency ?? "teadmata") },
  { id: "store", title: "Salvestus", run: async () => { if (!navigator.storage?.estimate) return "Salvestuse hinnangut ei ole."; const q = await navigator.storage.estimate(); return `${q.usage ?? 0} / ${q.quota ?? 0} baiti`; } },
  { id: "batt", title: "Aku", run: async () => { const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> }; if (!nav.getBattery) return "Aku liidest ei ole."; const b = await nav.getBattery(); return `${Math.round(b.level * 100)}% · ${b.charging ? "laeb" : "ei lae"}`; } },
  { id: "link", title: "Link", run: async () => { const c = (navigator as Navigator & { connection?: { effectiveType?: string; rtt?: number } }).connection; if (!c) return "Ühenduse liidest ei ole."; return `${c.effectiveType ?? "teadmata"} · rtt ${c.rtt ?? "teadmata"}`; } },
  { id: "uuid", title: "UUID", run: async () => crypto.randomUUID() },
  { id: "frames", title: "Kaadrid", run: async () => String(useDesk.getState().frames.length) },
  { id: "mem", title: "Mälu", run: async () => String(useMemory.getState().hosts.length) },
  { id: "role", title: "Roll", run: async () => useAccount.getState().session?.role ?? "väljas" },
  { id: "plat", title: "Platvorm", run: async () => navigator.platform },
  { id: "memgb", title: "RAM", run: async () => { const n = (navigator as Navigator & { deviceMemory?: number }).deviceMemory; return n == null ? "RAM-i liidest ei ole." : `${n} GB, umbkaudu`; } },
  { id: "touch", title: "Puude", run: async () => String(navigator.maxTouchPoints) },
];

export function KitPane() {
  const [text, setText] = useState("");
  const [line, setLine] = useState("25 tööriista. Tulemus tuleb sellest seadmest, mitte väljamõeldud mõõtmisest.");

  return (
    <div className="flex h-full flex-col">
      <input value={text} onChange={(event) => setText(event.target.value)} placeholder="tekst hashile ja koodile" className="m-3 h-11 border border-line bg-ink px-3 font-mono text-xs outline-none" />
      <div className="grid grid-cols-3 gap-2 px-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className="h-11 border border-line px-1 font-mono text-xs text-fg"
            onClick={() => {
              void tool.run(text).then(setLine).catch((error: unknown) => setLine(error instanceof Error ? error.message : "Ei õnnestunud."));
            }}
          >
            {tool.title}
          </button>
        ))}
      </div>
      <p className="px-3 py-3 font-mono text-xs text-muted">{line}</p>
    </div>
  );
}
