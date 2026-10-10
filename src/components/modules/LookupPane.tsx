import { useState } from "react";

type Record = {
  source?: string;
  query?: string;
  kind?: string;
  retrievedAt?: string;
  error?: string;
  name?: string | null;
  handle?: string | null;
  type?: string | null;
  country?: string | null;
  startAddress?: string | null;
  endAddress?: string | null;
};

const ROWS: { key: keyof Record; label: string }[] = [
  { key: "name", label: "Nimi" },
  { key: "handle", label: "Kirje" },
  { key: "type", label: "Tüüp" },
  { key: "country", label: "Riik" },
  { key: "startAddress", label: "Algus" },
  { key: "endAddress", label: "Lõpp" },
];

export function LookupPane() {
  const [query, setQuery] = useState("");
  const [record, setRecord] = useState<Record | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex h-full flex-col bg-ink">
      <div className="border-b border-line px-4 py-4">
        <p className="font-mono text-[10px] tracking-[0.22em] text-brass">LOOKUP · PEEGEL</p>
        <p className="mt-2 text-sm text-fg">Vasakul on päring. Paremal on see, mis register tagastas.</p>
        <p className="mt-1 text-xs text-muted">Tühja välja ei täideta. See ei ole inimese asukoht.</p>
      </div>
      <form
        className="flex gap-2 border-b border-line p-3"
        onSubmit={(event) => {
          event.preventDefault();
          const q = query.trim();
          if (!q || busy) return;
          setBusy(true);
          void fetch(`/api/rdap?q=${encodeURIComponent(q)}`, { cache: "no-store" })
            .then(async (response) => ({ ok: response.ok, body: (await response.json()) as Record }))
            .then(({ body }) => setRecord(body))
            .catch(() => setRecord({ query: q, error: "Registrini ei jõutud. Vastust ei mõeldud." }))
            .finally(() => setBusy(false));
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="IP, domeen või ASN"
          className="h-11 min-w-0 flex-1 border border-line bg-surface px-3 font-mono text-xs outline-none"
        />
        <button type="submit" className="h-11 border border-teal px-3 text-sm text-teal" disabled={busy}>
          {busy ? "…" : "Küsi"}
        </button>
      </form>
      <div className="grid min-h-0 flex-1 grid-cols-2">
        <section className="border-r border-line p-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted">PÄRING</p>
          <p className="mt-3 break-all font-mono text-sm text-fg">{record?.query || query || "veel tühi"}</p>
          <p className="mt-2 text-xs text-muted">{record?.kind ?? "tüüp selgub vastusest"}</p>
        </section>
        <section className="overflow-auto p-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted">REGISTER</p>
          {!record ? <p className="mt-3 text-sm text-muted">Vastust ei ole.</p> : null}
          {record?.error ? <p className="mt-3 text-sm text-brass">{record.error}</p> : null}
          {record && !record.error
            ? ROWS.map((row) => (
                <p key={row.key} className="mt-3">
                  <span className="block text-xs text-muted">{row.label}</span>
                  <span className="break-all font-mono text-xs text-fg">{record[row.key] || "ei tulnud"}</span>
                </p>
              ))
            : null}
          {record?.retrievedAt ? <p className="mt-4 font-mono text-[10px] text-muted">{record.retrievedAt}</p> : null}
          {record?.source ? <p className="font-mono text-[10px] text-muted">{record.source}</p> : null}
        </section>
      </div>
    </div>
  );
}
