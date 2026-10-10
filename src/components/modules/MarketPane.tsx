import { useDesk } from "@/lib/signal/store";
import type { ModuleId } from "@/lib/signal/types";

const FINDINGS: { id: string; market: string; miss: string; move: string; open: ModuleId | null }[] = [
  { id: "devtools", market: "Chrome DevTools", miss: "Näeb ainult brauserit, mitte masinat ega teisi programme.", move: "Audit ütleb, milline liides vastas.", open: "audit" },
  { id: "wireshark", market: "Wireshark", miss: "Näeb pakette, mitte lehe otsust, ja ei muuda liiklust.", move: "Pakette siia ei mõelda. 9block peatab ainult selle lehe päringu.", open: "block" },
  { id: "ublock", market: "uBlock Origin", miss: "Firefoxis täisversioon. Chrome'is Lite, mis ei asenda seda.", move: "Filter on selle lehe sees ega sõltu laienduse õigusest.", open: "block" },
  { id: "allowed", market: "WireGuardi rakendused", miss: "AllowedIPs aetakse segi kliendi oma aadressiga. Tühi väli teeb tihti täistunneli.", move: "Ainult host ja Kogu liiklus on eraldi nupud.", open: "wire" },
  { id: "nat", market: "Täistunneli juhendid", miss: "Fail üksi ei saada liiklust välja, kui server ei tee NAT-i.", move: "Käsud on akna all. Leht neid ei käivita.", open: "wire" },
  { id: "v6", market: "Ainult IPv4 tunnel", miss: "Ilma ::/0 reata võib IPv6 minna tunnelist mööda.", move: "Kogu liiklus kirjutab mõlemad read ja DNS-i.", open: "wire" },
  { id: "handshake", market: "VPN-i nupp Sees", miss: "Nupp võib põleda enne käepigistust.", move: "Olek tuleb käsuga wg. Kui vastust ei ole, on tunnel väljas.", open: "wire" },
  { id: "phone", market: "Numbri järgi asukoht", miss: "Avalikku liidest, mis annaks võõra telefoni asukoha, ei ole.", move: "Ei ehitata. Ainult selle seadme luba.", open: "host" },
  { id: "av", market: "Viirusetõrje", miss: "Lubab ketta ja teised programmid üle vaadata.", move: "Ei ehitata. Leht ei näe teisi programme.", open: null },
  { id: "os", market: "Uus operatsioonisüsteem", miss: "Turu tipp juhib kogu masinat. Leht ei saa seda rolli võtta.", move: "Ei ehitata. See jääb lauaks brauseris.", open: null },
];

export function MarketPane() {
  return (
    <div>
      <p className="border-b border-line px-3 py-3 text-xs text-muted">
        Kümme turu leidu. Eelis on piir, mitte nende kopeerimine. Ülejäänud mooduleid, liideseid ja nuppe, mis seda piiri valetaksid, ei lisata.
      </p>
      <ul>
        {FINDINGS.map((row) => (
          <li key={row.id} className="border-b border-line px-3 py-3">
            <p className="font-mono text-xs text-brass">{row.market}</p>
            <p className="mt-1 text-xs text-muted">{row.miss}</p>
            <p className="mt-1 text-xs text-fg">{row.move}</p>
            {row.open ? (
              <button type="button" className="mt-2 h-11 w-full border border-line text-xs text-teal" onClick={() => useDesk.getState().openModule(row.open as ModuleId)}>
                Ava
              </button>
            ) : (
              <p className="mt-2 font-mono text-xs text-brass">Kinni</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
