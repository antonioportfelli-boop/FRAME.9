export type Slip = {
  token: string;
  address: string;
  note: string;
};

export type Verdict =
  | { kind: "drop"; line: string }
  | { kind: "miss"; line: string; token: string }
  | { kind: "kept"; line: string; token: string; from: string; body: string };

function tokenOf(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function mintSlip(local: string, domain: string, note: string): Slip | null {
  const box = local.trim();
  const host = domain.trim();
  if (!/^[a-z0-9._-]{1,32}$/i.test(box) || !/^[a-z0-9.-]{1,80}$/i.test(host)) return null;
  const raw = new Uint8Array(12);
  crypto.getRandomValues(raw);
  const token = tokenOf(raw);
  return { token, address: `${box}+${token}@${host}`, note: note.trim().slice(0, 160) };
}

function head(raw: string): string {
  return (raw.split(/\r?\n\r?\n/)[0] ?? "").replace(/\r?\n[ \t]+/g, " ");
}

function field(raw: string, name: string): string {
  const row = head(raw)
    .split(/\r?\n/)
    .find((line) => line.toLowerCase().startsWith(`${name.toLowerCase()}:`));
  return row ? row.slice(name.length + 1).trim() : "";
}

function mailbox(value: string): string {
  const wrapped = value.match(/<([^>]+)>/);
  return (wrapped ? wrapped[1] : value).trim();
}

function plain(raw: string): string {
  const parts = raw.split(/\r?\n\r?\n/);
  const body = parts.slice(1).join("\n\n");
  if (!/content-type:\s*multipart\//i.test(head(raw))) return body.trim().slice(0, 4000);
  const chunks = body.split(/\r?\n--/);
  const texts = chunks
    .filter((chunk) => /content-type:\s*text\/plain/i.test(chunk))
    .map((chunk) => chunk.split(/\r?\n\r?\n/).slice(1).join("\n\n").trim());
  return texts.join("\n").trim().slice(0, 4000);
}

export function judge(raw: string, local: string, domain: string, slips: Slip[]): Verdict {
  const to = mailbox(field(raw, "to"));
  const box = local.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const host = domain.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hit = to.match(new RegExp(`^${box}\\+([A-Za-z0-9_-]{16})@${host}$`, "i"));
  if (!hit) return { kind: "drop", line: "See kiri ei ole vastus. Aadressil ei ole märki." };
  const token = hit[1];
  const slip = slips.find((item) => item.token === token);
  if (!slip) return { kind: "miss", token, line: "Märk on kujult õige, aga sellist sedelit ei ole. Kirja ei seota." };
  return {
    kind: "kept",
    token,
    from: field(raw, "from") || "saatja puudu",
    body: plain(raw) || "teksti ei ole",
    line: `Seotud sedeliga ${slip.note || slip.address}.`,
  };
}
