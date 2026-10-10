export type WireKeys = { privateKey: string; publicKey: string };

function bytesToBase64(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function generateWireKeys(): Promise<WireKeys> {
  const pair = await crypto.subtle.generateKey({ name: "X25519" }, true, ["deriveBits"]);
  if (!("privateKey" in pair) || !("publicKey" in pair)) throw new Error("X25519 key pair unavailable.");
  const secret = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
  if (!secret.d || !pub.x) throw new Error("X25519 võtit ei saanud eksportida.");
  return {
    privateKey: bytesToBase64(base64UrlToBytes(secret.d)),
    publicKey: bytesToBase64(base64UrlToBytes(pub.x)),
  };
}

export function wireConfig(opts: { privateKey: string; address: string; peerKey: string; endpoint: string; allowed: string }): string {
  const dns = opts.allowed.includes("0.0.0.0/0") ? "DNS = 1.1.1.1\n" : "";
  return `[Interface]\nPrivateKey = ${opts.privateKey}\nAddress = ${opts.address}\n${dns}\n[Peer]\nPublicKey = ${opts.peerKey}\nEndpoint = ${opts.endpoint}\nAllowedIPs = ${opts.allowed}\nPersistentKeepalive = 25\n`;
}

export async function generateWirePair(): Promise<{ server: WireKeys; phone: WireKeys }> {
  const server = await generateWireKeys();
  const phone = await generateWireKeys();
  return { server, phone };
}

export function serverPeersConfig(server: WireKeys, peers: { publicKey: string; address: string }[]): string {
  const head = `[Interface]\nPrivateKey = ${server.privateKey}\nAddress = 10.9.0.1/24\nListenPort = 51820\n`;
  const body = peers.map((peer) => `\n[Peer]\nPublicKey = ${peer.publicKey}\nAllowedIPs = ${peer.address}\n`).join("");
  return head + body;
}

export function phoneWireConfig(phone: WireKeys, serverPublic: string, endpoint: string, address = "10.9.0.2/32", scope: "host" | "all" = "host"): string {
  const allowed = scope === "all" ? "0.0.0.0/0, ::/0" : "10.9.0.1/32";
  const dns = scope === "all" ? "DNS = 1.1.1.1\n" : "";
  return `[Interface]\nPrivateKey = ${phone.privateKey}\nAddress = ${address}\n${dns}\n[Peer]\nPublicKey = ${serverPublic}\nEndpoint = ${endpoint}\nAllowedIPs = ${allowed}\nPersistentKeepalive = 25\n`;
}

export function validWireKey(value: string): boolean {
  try {
    const bytes = base64UrlToBytes(value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
    return bytes.length === 32;
  } catch {
    return false;
  }
}
