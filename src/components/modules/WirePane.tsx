import { useState } from "react";
import {
  generateWireKeys,
  generateWirePair,
  phoneWireConfig,
  serverPeersConfig,
  validWireKey,
  wireConfig,
  type WireKeys,
} from "@/lib/signal/wire";

type Kind = "client" | "host";

type Peer = { id: string; name: string; keys: WireKeys; address: string; scope: "host" | "all" };

function save(name: string, text: string) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function endpointOk(value: string): boolean {
  const text = value.trim();
  return /^[a-z0-9.-]+:\d{2,5}$/i.test(text) && !/^host:/i.test(text);
}

export function WirePane() {
  const [kind, setKind] = useState<Kind>("host");
  const [status, setStatus] = useState("Tunnel väljas. Käepigistust ei ole loetud.");
  const [note, setNote] = useState<string | null>("host on näidis, mitte selle arvuti aadress. Asenda see avaliku aadressiga. Siis saab failid teha.");
  const [endpoint, setEndpoint] = useState("host:51820");
  const [peerKey, setPeerKey] = useState("");
  const [allowed, setAllowed] = useState("10.9.0.1/32");
  const [clientKeys, setClientKeys] = useState<WireKeys | null>(null);
  const [server, setServer] = useState<WireKeys | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [iface, setIface] = useState("eth0");
  const card = /^[a-zA-Z0-9._:-]{1,16}$/.test(iface) ? iface : "eth0";
  const full = kind === "host" ? peers.some((peer) => peer.scope === "all") : allowed.includes("0.0.0.0/0");
  const step = !endpointOk(endpoint) ? 1 : server ? 3 : 2;

  async function readStatus() {
    try {
      const response = await fetch("/frame9-wire", { cache: "no-store" });
      if (!response.ok) throw new Error("missing");
      const body = (await response.json()) as { line?: string };
      setStatus(body.line ?? "Tunnel väljas.");
    } catch {
      setStatus("Tunnel väljas. See leht ei käivitanud WireGuardi.");
    }
  }

  async function addPeer() {
    const keys = await generateWireKeys();
    const n = peers.length + 2;
    setPeers((list) => [...list, { id: crypto.randomUUID(), name: n === 2 ? "Telefon" : `Seade ${n - 1}`, keys, address: `10.9.0.${n}/32`, scope: "host" }]);
  }

  return (
    <div className="flex h-full flex-col bg-ink">
      <div className="border-b border-line px-4 py-4">
        <p className="font-mono text-[10px] tracking-[0.22em] text-brass">WIRE · SAMM {step}</p>
        <p className="mt-2 text-sm text-fg">
          {step === 1 ? "Kirjuta selle arvuti avalik aadress. Ilma selleta faile ei tehta ja serverit ei käivitata." : step === 2 ? "Aadress on olemas. Järgmine on Loo host, siis laadi mõlemad failid." : "Failid on siin. Port, wg-quick ja telefon on sinu arvutis. Olek tuleb alles lõpus."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 border-b border-line p-3">
        {(
          [
            ["host", "See arvuti"],
            ["client", "Klient"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`h-14 border text-sm ${kind === id ? "border-teal bg-teal-2 text-fg" : "border-line text-muted"}`}
            onClick={() => setKind(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {kind === "host" ? (
        <div className="flex flex-col gap-3 p-4">
          <ol className="list-decimal space-y-2 pl-4 text-xs text-muted">
            <li className={endpointOk(endpoint) ? "text-teal" : ""}>Kirjuta avalik aadress kujul host:51820.</li>
            <li className={server ? "text-teal" : ""}>Loo host ja laadi serveri ning telefoni fail.</li>
            <li>Suuna ruuteris UDP 51820 sellele arvutile.</li>
            <li>Käivita arvutis wg-quick up.</li>
            <li>Impordi telefoni fail ja lülita see sisse.</li>
            <li>Loe olek. Enne käepigistust on tunnel väljas.</li>
          </ol>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.16em] text-muted">AVALIK AADRESS</span>
            <input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="host:51820" autoFocus className="mt-1 h-11 w-full border border-teal bg-surface px-3 font-mono text-xs outline-none" />
          </label>
          {step === 1 ? (
            <button
              type="button"
              className="h-11 border border-teal text-sm text-teal"
              onClick={() => {
                void fetch("/api/host-address", { cache: "no-store" })
                  .then((response) => (response.ok ? response.json() : Promise.reject()))
                  .then((body: { address?: string | null; note?: string }) => {
                    if (!body.address) {
                      setNote(body.note ?? "Avalikku aadressi ei paistnud. Kirjuta see ise.");
                      return;
                    }
                    setEndpoint(`${body.address}:51820`);
                    setNote(body.note ?? "Aadress on loetud. Kontrolli seda enne failide tegemist.");
                  })
                  .catch(() => setNote("Aadressi ei saanud lugeda. Kirjuta see ise."));
              }}
            >
              Alusta
            </button>
          ) : null}
          <button
            type="button"
            className="h-11 border border-teal text-sm text-teal"
            onClick={() => {
              if (!endpointOk(endpoint)) {
                setNote("Aadress olgu host:51820. Serverit ei käivitatud.");
                return;
              }
              void generateWirePair()
                .then((pair) => {
                  setServer(pair.server);
                  setPeers([{ id: crypto.randomUUID(), name: "Telefon", keys: pair.phone, address: "10.9.0.2/32", scope: "host" }]);
                  setNote("Host ja esimene seade on valmis. Lisa veel seadmeid, siis laadi iga fail eraldi.");
                })
                .catch(() => setNote("Võtit ei saanud teha."));
            }}
          >
            Loo host
          </button>
          {server ? (
            <>
              <p className="break-all font-mono text-[11px] text-muted">Hosti avalik võti {server.publicKey}</p>
              <div className="flex gap-2">
                <button type="button" className="h-11 flex-1 border border-teal text-xs text-teal" onClick={() => save("frame9-server.conf", serverPeersConfig(server, peers.map((peer) => ({ publicKey: peer.keys.publicKey, address: peer.address }))))}>
                  Serveri fail
                </button>
                <button
                  type="button"
                  className="h-11 flex-1 border border-line text-xs"
                  onClick={() => {
                    void addPeer().catch(() => setNote("Seadet ei saanud lisada."));
                  }}
                >
                  Lisa seade
                </button>
              </div>
              {peers.map((peer) => (
                <div key={peer.id} className="border border-line bg-surface p-3">
                  <input
                    value={peer.name}
                    onChange={(event) => setPeers((list) => list.map((item) => (item.id === peer.id ? { ...item, name: event.target.value } : item)))}
                    className="h-11 w-full border border-line bg-ink px-3 text-sm outline-none"
                  />
                  <p className="mt-2 font-mono text-[11px] text-brass">{peer.address}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" className={`h-11 border text-xs ${peer.scope === "host" ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => setPeers((list) => list.map((item) => (item.id === peer.id ? { ...item, scope: "host" } : item)))}>
                      Ainult host
                    </button>
                    <button type="button" className={`h-11 border text-xs ${peer.scope === "all" ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => setPeers((list) => list.map((item) => (item.id === peer.id ? { ...item, scope: "all" } : item)))}>
                      Kogu liiklus
                    </button>
                  </div>
                  <button
                    type="button"
                    className="mt-2 h-11 w-full border border-line text-xs"
                    onClick={() => save(`frame9-${peer.name.replace(/[^\w-]+/g, "-").toLowerCase() || "seade"}.conf`, phoneWireConfig(peer.keys, server.publicKey, endpoint.trim(), peer.address, peer.scope))}
                  >
                    Laadi selle seadme fail
                  </button>
                </div>
              ))}
            </>
          ) : null}
          <p className="border border-line bg-surface px-3 py-3 font-mono text-xs text-muted">{status}</p>
          <button type="button" className="h-11 border border-line text-xs text-fg" onClick={() => void readStatus()}>
            Loe olek
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          <p className="text-xs text-muted">See seade liitub kellegi teise serveriga. Üks fail, üks võti.</p>
          <button
            type="button"
            className="h-11 border border-teal text-sm text-teal"
            onClick={() => {
              void generateWireKeys().then(setClientKeys).catch(() => setNote("Võtit ei saanud teha."));
            }}
          >
            Loo kliendi võti
          </button>
          {clientKeys ? <p className="break-all font-mono text-[11px] text-muted">{clientKeys.publicKey}</p> : null}
          <input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="server:51820" className="h-11 border border-line bg-surface px-3 font-mono text-xs outline-none" />
          <input value={peerKey} onChange={(event) => setPeerKey(event.target.value)} placeholder="serveri avalik võti" className="h-11 border border-line bg-surface px-3 font-mono text-xs outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={`h-11 border text-xs ${allowed === "10.9.0.1/32" ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => setAllowed("10.9.0.1/32")}>
              Ainult host
            </button>
            <button type="button" className={`h-11 border text-xs ${allowed.includes("0.0.0.0/0") ? "border-teal text-teal" : "border-line text-muted"}`} onClick={() => setAllowed("0.0.0.0/0, ::/0")}>
              Kogu liiklus
            </button>
          </div>
          <input value={allowed} onChange={(event) => setAllowed(event.target.value)} className="h-11 border border-line bg-surface px-3 font-mono text-xs outline-none" />
          <button
            type="button"
            className="h-11 border border-line text-xs"
            onClick={() => {
              if (!clientKeys) {
                setNote("Kõigepealt loo võti.");
                return;
              }
              if (!endpointOk(endpoint) || !validWireKey(peerKey.trim())) {
                setNote("Endpoint või serveri võti ei kõlba.");
                return;
              }
              save(
                "frame9-client.conf",
                wireConfig({
                  privateKey: clientKeys.privateKey,
                  address: "10.9.0.2/32",
                  peerKey: peerKey.trim(),
                  endpoint: endpoint.trim(),
                  allowed: allowed.trim(),
                }),
              );
              setNote("Fail on all. Tunnel käivitub alles käsuga wg-quick up.");
            }}
          >
            Laadi kliendi fail
          </button>
          <p className="border border-line bg-surface px-3 py-3 font-mono text-xs text-muted">{status}</p>
          <button type="button" className="h-11 border border-line text-xs text-fg" onClick={() => void readStatus()}>
            Loe olek
          </button>
        </div>
      )}
      {note ? <p className="px-4 pb-2 text-xs text-muted">{note}</p> : null}
      {full ? (
        <div className="px-4 pb-4">
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.16em] text-muted">VÕRGUKAART</span>
            <input value={iface} onChange={(event) => setIface(event.target.value)} className="mt-1 h-11 w-full border border-line bg-surface px-3 font-mono text-xs outline-none" />
          </label>
          <p className="mt-2 font-mono text-[11px] text-brass">
            Kogu liiklus kirjutab AllowedIPs = 0.0.0.0/0, ::/0 ja DNS = 1.1.1.1. Linuxis: sysctl -w net.ipv4.ip_forward=1 ja iptables -t nat -A POSTROUTING -s 10.9.0.0/24 -o {card} -j MASQUERADE. See leht käsku ei käivita.
          </p>
        </div>
      ) : null}
    </div>
  );
}
