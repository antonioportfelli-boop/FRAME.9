import type { Domain, Field, FrameDraft, Layer, Origin, Source } from "@/lib/signal/types";

const MAC_STA = "02:09:4e:45:54:10";
const MAC_AP = "02:09:4e:45:54:01";
const MAC_GW = "02:09:4e:45:54:fe";
const MAC_BCAST = "ff:ff:ff:ff:ff:ff";
const MAC_TAG = "02:09:4e:45:54:b1";
const MAC_HID = "02:09:4e:45:54:b2";
const IP_STA = [10, 9, 0, 20];
const IP_GW = [10, 9, 0, 1];
const IP_BCAST = [255, 255, 255, 255];

export type Bench = {
  t0: number;
  seq: number;
  ipId: number;
  dhcpXid: number;
  tcpSport: number;
  tcpSeq: number;
  ccVideo: number;
  ccAudio: number;
  ccPat: number;
  psSeg: number;
  kind: number;
};

export function makeBench(now = 0): Bench {
  return {
    t0: now,
    seq: 16,
    ipId: 0x4e01,
    dhcpXid: 0x4e455409,
    tcpSport: 51413,
    tcpSeq: 0x09a04e10,
    ccVideo: 0,
    ccAudio: 0,
    ccPat: 0,
    psSeg: 0,
    kind: 0,
  };
}

function macBytes(mac: string): number[] {
  return mac.split(":").map((part) => Number.parseInt(part, 16) & 255);
}

function macAir(mac: string): number[] {
  return macBytes(mac).reverse();
}

function hexByte(n: number): string {
  return (n & 255).toString(16).padStart(2, "0");
}

function ipv4Checksum(words: number[]): number {
  let sum = 0;
  for (let i = 0; i < words.length; i += 2) {
    sum += ((words[i] ?? 0) << 8) | (words[i + 1] ?? 0);
  }
  while (sum >> 16) sum = (sum & 0xffff) + (sum >> 16);
  return ~sum & 0xffff;
}

function write16(buf: number[], offset: number, value: number) {
  buf[offset] = (value >> 8) & 255;
  buf[offset + 1] = value & 255;
}

type IpPacket = {
  bytes: Uint8Array;
  layers: Layer[];
};

function ethIpTransport(opts: {
  ethDst: string;
  ethSrc: string;
  src: number[];
  dst: number[];
  proto: 6 | 17;
  protoName: string;
  id: number;
  segment: number[];
  checksumAt: number;
  l4name: string;
  l4fields: (base: number) => Field[];
}): IpPacket {
  const segment = opts.segment.slice();
  write16(segment, opts.checksumAt, 0);
  const total = 20 + segment.length;
  const ip: number[] = [
    0x45, 0x00, (total >> 8) & 255, total & 255,
    (opts.id >> 8) & 255, opts.id & 255,
    0x40, 0x00,
    64, opts.proto,
    0, 0,
    ...opts.src,
    ...opts.dst,
  ];
  const ipSum = ipv4Checksum(ip);
  write16(ip, 10, ipSum);

  const pseudo = [
    ...opts.src,
    ...opts.dst,
    0,
    opts.proto,
    (segment.length >> 8) & 255,
    segment.length & 255,
    ...segment,
  ];
  if (pseudo.length % 2) pseudo.push(0);
  let tsum = ipv4Checksum(pseudo);
  if (tsum === 0) tsum = 0xffff;
  write16(segment, opts.checksumAt, tsum);

  const eth = [...macBytes(opts.ethDst), ...macBytes(opts.ethSrc), 0x08, 0x00];
  const bytes = Uint8Array.from([...eth, ...ip, ...segment]);
  const l4 = 34;
  const layers: Layer[] = [
    {
      name: "Ethernet II",
      fields: [
        { label: "Destination", value: opts.ethDst, offset: 0, length: 6 },
        { label: "Source", value: opts.ethSrc, offset: 6, length: 6 },
        { label: "Type", value: "IPv4 (0x0800)", offset: 12, length: 2 },
      ],
    },
    {
      name: "Internet Protocol Version 4",
      fields: [
        { label: "Version / IHL", value: "4 / 5", offset: 14, length: 1 },
        { label: "Total length", value: String(total), offset: 16, length: 2 },
        { label: "Identification", value: `0x${opts.id.toString(16)}`, offset: 18, length: 2 },
        { label: "Flags", value: "Don't fragment", offset: 20, length: 2 },
        { label: "TTL", value: "64", offset: 22, length: 1 },
        { label: "Protocol", value: opts.protoName, offset: 23, length: 1 },
        { label: "Header checksum", value: `0x${ipSum.toString(16).padStart(4, "0")}`, offset: 24, length: 2 },
        { label: "Source", value: opts.src.join("."), offset: 26, length: 4 },
        { label: "Destination", value: opts.dst.join("."), offset: 30, length: 4 },
      ],
    },
    { name: opts.l4name, fields: opts.l4fields(l4) },
  ];
  return { bytes, layers };
}

function draft(partial: Omit<FrameDraft, "len" | "source"> & { source?: Source; bytes: Uint8Array | null }): FrameDraft {
  return {
    ...partial,
    len: partial.bytes?.length ?? 0,
    source: partial.source ?? (partial.origin === "bench" ? "SYNTHETIC_DEMO" : "LIVE_HOST"),
  };
}

function beacon(bench: Bench, rel: number): FrameDraft {
  const channel = 6;
  const ssid = "NET9-LAB";
  const ssidBytes = Array.from(ssid).map((c) => c.charCodeAt(0));
  const seq = bench.seq & 0xfff;
  const sc0 = ((seq & 0x0f) << 4) | 0;
  const sc1 = (seq >> 4) & 255;
  const body = [
    0, 0, 0, 0, 0, 0, 0, 1,
    100, 0,
    0x11, 0x04,
    0x00, ssidBytes.length, ...ssidBytes,
    0x01, 0x08, 0x82, 0x84, 0x8b, 0x96, 0x0c, 0x12, 0x18, 0x24,
    0x03, 0x01, channel,
  ];
  const header = [
    0x80, 0x00, 0x00, 0x00,
    ...macBytes(MAC_BCAST),
    ...macBytes(MAC_AP),
    ...macBytes(MAC_AP),
    sc0, sc1,
  ];
  const bytes = Uint8Array.from([...header, ...body]);
  const ssidAt = 24 + 8 + 2 + 2 + 2;
  const layers: Layer[] = [
    {
      name: "IEEE 802.11 Beacon frame",
      fields: [
        { label: "Type / Subtype", value: "Management / Beacon (0x80)", offset: 0, length: 1 },
        { label: "Flags", value: "From DS 0, To DS 0", offset: 1, length: 1 },
        { label: "Duration", value: "0", offset: 2, length: 2 },
        { label: "Receiver", value: MAC_BCAST, offset: 4, length: 6 },
        { label: "Transmitter", value: MAC_AP, offset: 10, length: 6 },
        { label: "BSSID", value: MAC_AP, offset: 16, length: 6 },
        { label: "Sequence", value: String(seq), offset: 22, length: 2 },
        { label: "Timestamp", value: "1", offset: 24, length: 8 },
        { label: "Beacon interval", value: "100 TU", offset: 32, length: 2 },
        { label: "Capability", value: "ESS, short preamble, short slot (0x0411)", offset: 34, length: 2 },
        { label: "SSID", value: ssid, offset: ssidAt, length: ssidBytes.length },
        { label: "DS channel", value: String(channel), offset: bytes.length - 1, length: 1 },
      ],
    },
  ];
  return draft({
    rel,
    src: MAC_AP,
    dst: MAC_BCAST,
    proto: "802.11",
    info: `Beacon, SSID ${ssid}, ch ${channel}`,
    origin: "bench",
    domain: "link",
    srcNode: "ap",
    dstNode: "sta",
    bytes,
    layers,
  });
}

function probe(bench: Bench, rel: number): FrameDraft {
  const ssid = "NET9-LAB";
  const ssidBytes = Array.from(ssid).map((c) => c.charCodeAt(0));
  const seq = bench.seq & 0xfff;
  const bytes = Uint8Array.from([
    0x40, 0x00, 0x00, 0x00,
    ...macBytes(MAC_BCAST),
    ...macBytes(MAC_STA),
    ...macBytes(MAC_BCAST),
    ((seq & 0x0f) << 4), (seq >> 4) & 255,
    0x00, ssidBytes.length, ...ssidBytes,
    0x01, 0x04, 0x02, 0x04, 0x0b, 0x16,
  ]);
  return draft({
    rel,
    src: MAC_STA,
    dst: MAC_BCAST,
    proto: "802.11",
    info: `Probe request, SSID ${ssid}`,
    origin: "bench",
    domain: "link",
    srcNode: "sta",
    dstNode: "ap",
    bytes,
    layers: [
      {
        name: "IEEE 802.11 Probe Request",
        fields: [
          { label: "Type / Subtype", value: "Management / Probe Request (0x40)", offset: 0, length: 1 },
          { label: "Transmitter", value: MAC_STA, offset: 10, length: 6 },
          { label: "SSID", value: ssid, offset: 26, length: ssidBytes.length },
        ],
      },
    ],
  });
}

function dhcp(bench: Bench, rel: number): FrameDraft {
  const chaddr = [...macBytes(MAC_STA), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const bootp = [
    1, 1, 6, 0,
    (bench.dhcpXid >> 24) & 255, (bench.dhcpXid >> 16) & 255, (bench.dhcpXid >> 8) & 255, bench.dhcpXid & 255,
    0, 0, 0x80, 0x00,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    ...chaddr,
    ...new Array(64).fill(0),
    ...new Array(128).fill(0),
    0x63, 0x82, 0x53, 0x63,
    53, 1, 1,
    61, 7, 1, ...macBytes(MAC_STA),
    55, 3, 1, 3, 6,
    255,
  ];
  const udpLen = 8 + bootp.length;
  const segment = [
    0, 68, 0, 67,
    (udpLen >> 8) & 255, udpLen & 255,
    0, 0,
    ...bootp,
  ];
  const built = ethIpTransport({
    ethDst: MAC_BCAST,
    ethSrc: MAC_STA,
    src: IP_STA,
    dst: IP_BCAST,
    proto: 17,
    protoName: "UDP (17)",
    id: bench.ipId,
    segment,
    checksumAt: 6,
    l4name: "User Datagram Protocol",
    l4fields: (base) => [
      { label: "Source port", value: "68", offset: base, length: 2 },
      { label: "Destination port", value: "67", offset: base + 2, length: 2 },
      { label: "Length", value: String(udpLen), offset: base + 4, length: 2 },
      { label: "Checksum", value: "computed", offset: base + 6, length: 2 },
    ],
  });
  const dhcpAt = 34 + 8;
  built.layers.push({
    name: "Dynamic Host Configuration Protocol",
    fields: [
      { label: "Message type (op)", value: "Boot request (1)", offset: dhcpAt, length: 1 },
      { label: "Hardware type", value: "Ethernet (1)", offset: dhcpAt + 1, length: 1 },
      { label: "Hardware len", value: "6", offset: dhcpAt + 2, length: 1 },
      { label: "Transaction id", value: "0x4e455409", offset: dhcpAt + 4, length: 4 },
      { label: "Client MAC", value: MAC_STA, offset: dhcpAt + 28, length: 6 },
      { label: "Magic cookie", value: "DHCP", offset: dhcpAt + 236, length: 4 },
      { label: "Option 53", value: "Discover (1)", offset: dhcpAt + 240, length: 3 },
    ],
  });
  return draft({
    rel,
    src: "10.9.0.20",
    dst: "255.255.255.255",
    proto: "DHCP",
    info: "Discover, xid 0x4e455409",
    origin: "bench",
    domain: "stack",
    srcNode: "sta",
    dstNode: "dhcp",
    bytes: built.bytes,
    layers: built.layers,
  });
}

function dns(bench: Bench, rel: number): FrameDraft {
  const qname = [4, ..."net9".split("").map((c) => c.charCodeAt(0)), 3, ..."lab".split("").map((c) => c.charCodeAt(0)), 0];
  const payload = [
    0x4e, 0x09,
    0x01, 0x00,
    0x00, 0x01,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00,
    ...qname,
    0x00, 0x01,
    0x00, 0x01,
  ];
  const udpLen = 8 + payload.length;
  const segment = [0xc0, 0x12, 0x00, 53, (udpLen >> 8) & 255, udpLen & 255, 0, 0, ...payload];
  const built = ethIpTransport({
    ethDst: MAC_GW,
    ethSrc: MAC_STA,
    src: IP_STA,
    dst: IP_GW,
    proto: 17,
    protoName: "UDP (17)",
    id: bench.ipId,
    segment,
    checksumAt: 6,
    l4name: "User Datagram Protocol",
    l4fields: (base) => [
      { label: "Source port", value: "49170", offset: base, length: 2 },
      { label: "Destination port", value: "53", offset: base + 2, length: 2 },
      { label: "Length", value: String(udpLen), offset: base + 4, length: 2 },
    ],
  });
  const dnsAt = 42;
  built.layers.push({
    name: "Domain Name System",
    fields: [
      { label: "Transaction ID", value: "0x4e09", offset: dnsAt, length: 2 },
      { label: "Flags", value: "Standard query, RD (0x0100)", offset: dnsAt + 2, length: 2 },
      { label: "Questions", value: "1", offset: dnsAt + 4, length: 2 },
      { label: "Name", value: "net9.lab", offset: dnsAt + 12, length: qname.length },
      { label: "Type", value: "A", offset: dnsAt + 12 + qname.length, length: 2 },
      { label: "Class", value: "IN", offset: dnsAt + 14 + qname.length, length: 2 },
    ],
  });
  return draft({
    rel,
    src: "10.9.0.20",
    dst: "10.9.0.1",
    proto: "DNS",
    info: "Standard query A net9.lab",
    origin: "bench",
    domain: "stack",
    srcNode: "sta",
    dstNode: "dns",
    bytes: built.bytes,
    layers: built.layers,
  });
}

function tcpSyn(bench: Bench, rel: number): FrameDraft {
  const segment = new Array(20).fill(0);
  write16(segment, 0, bench.tcpSport);
  write16(segment, 2, 443);
  segment[4] = (bench.tcpSeq >> 24) & 255;
  segment[5] = (bench.tcpSeq >> 16) & 255;
  segment[6] = (bench.tcpSeq >> 8) & 255;
  segment[7] = bench.tcpSeq & 255;
  segment[12] = 0x50;
  segment[13] = 0x02;
  write16(segment, 14, 65535);
  const built = ethIpTransport({
    ethDst: MAC_GW,
    ethSrc: MAC_STA,
    src: IP_STA,
    dst: IP_GW,
    proto: 6,
    protoName: "TCP (6)",
    id: bench.ipId,
    segment,
    checksumAt: 16,
    l4name: "Transmission Control Protocol",
    l4fields: (base) => [
      { label: "Source port", value: String(bench.tcpSport), offset: base, length: 2 },
      { label: "Destination port", value: "443", offset: base + 2, length: 2 },
      { label: "Sequence", value: `0x${bench.tcpSeq.toString(16)}`, offset: base + 4, length: 4 },
      { label: "Data offset", value: "5 (20 bytes)", offset: base + 12, length: 1 },
      { label: "Flags", value: "SYN", offset: base + 13, length: 1 },
      { label: "Window", value: "65535", offset: base + 14, length: 2 },
      { label: "Checksum", value: "computed", offset: base + 16, length: 2 },
      {
        label: "IANA note",
        value: "Port 443 is a registered/common service association (https). Not proof of a specific application.",
        offset: 0,
        length: 0,
      },
    ],
  });
  return draft({
    rel,
    src: `10.9.0.20:${bench.tcpSport}`,
    dst: "10.9.0.1:443",
    proto: "TCP",
    info: `SYN → 10.9.0.1:443`,
    origin: "bench",
    domain: "stack",
    srcNode: "tcp",
    dstNode: "gw",
    bytes: built.bytes,
    layers: built.layers,
  });
}

function bleAdv(rel: number): FrameDraft {
  const name = "NET9-TAG";
  const nameBytes = Array.from(name).map((c) => c.charCodeAt(0));
  const ad = [0x02, 0x01, 0x06, nameBytes.length + 1, 0x09, ...nameBytes];
  const advA = macAir(MAC_TAG);
  const payload = [...advA, ...ad];
  const bytes = Uint8Array.from([0x00, payload.length, ...payload]);
  return draft({
    rel,
    src: MAC_TAG,
    dst: MAC_BCAST,
    proto: "BLE",
    info: "ADV_IND NET9-TAG",
    origin: "bench",
    domain: "ble",
    srcNode: "tag",
    dstNode: "ble",
    bytes,
    layers: [
      {
        name: "BLE Advertising PDU",
        fields: [
          { label: "PDU type", value: "ADV_IND (0x00)", offset: 0, length: 1 },
          { label: "Length", value: String(payload.length), offset: 1, length: 1 },
          { label: "AdvA", value: `${MAC_TAG} (on-air order)`, offset: 2, length: 6 },
          { label: "Flags AD", value: "LE General + BR/EDR not supported (0x06)", offset: 8, length: 3 },
          { label: "Complete local name", value: name, offset: 13, length: nameBytes.length },
        ],
      },
    ],
  });
}

function attRead(rel: number): FrameDraft {
  const bytes = Uint8Array.from([0x0a, 0x16, 0x00]);
  return draft({
    rel,
    src: MAC_HID,
    dst: "ATT",
    proto: "ATT",
    info: "Read request, handle 0x0016",
    origin: "bench",
    domain: "ble",
    srcNode: "hid",
    dstNode: "att",
    bytes,
    layers: [
      {
        name: "Attribute Protocol",
        fields: [
          { label: "Opcode", value: "Read Request (0x0A)", offset: 0, length: 1 },
          { label: "Handle", value: "0x0016", offset: 1, length: 2 },
        ],
      },
    ],
  });
}

const PS = ["NE", "T9", "LA", "B "];

function rds(bench: Bench, rel: number): FrameDraft {
  const seg = bench.psSeg & 3;
  const pair = PS[seg] ?? "NE";
  const blockB = 0x02a0 | seg;
  const words = [0x4e39, blockB, 0xe0e0, (pair.charCodeAt(0) << 8) | pair.charCodeAt(1)];
  const bytes = Uint8Array.from(words.flatMap((w) => [(w >> 8) & 255, w & 255]));
  return draft({
    rel,
    src: "98.4",
    dst: "RDS",
    proto: "RDS",
    info: `Group 0A PS "${pair}" seg ${seg}`,
    origin: "bench",
    domain: "radio",
    srcNode: "fm",
    dstNode: "rds",
    bytes,
    layers: [
      {
        name: "RDS group 0A (block data, checkwords omitted)",
        fields: [
          { label: "PI", value: "0x4E39", offset: 0, length: 2 },
          { label: "Group / TP / PTY / seg", value: `0A, TP, PTY 10, segment ${seg}`, offset: 2, length: 2 },
          { label: "Block C", value: "0xE0E0 (AF unused on bench)", offset: 4, length: 2 },
          { label: "PS chars", value: pair, offset: 6, length: 2 },
        ],
      },
    ],
  });
}

function dab(rel: number): FrameDraft {
  const label = "NET9 DAB".padEnd(16, " ");
  const body = [
    0x00,
    0x4e, 0x09,
    0xff, 0xff,
    ...Array.from(label).map((c) => c.charCodeAt(0)),
  ];
  const bytes = Uint8Array.from([(1 << 5) | body.length, ...body]);
  return draft({
    rel,
    src: "EId 4E09",
    dst: "FIC",
    proto: "DAB",
    info: "FIG 1/0 ensemble NET9 DAB",
    origin: "bench",
    domain: "radio",
    srcNode: "dab",
    dstNode: "sdr",
    bytes,
    layers: [
      {
        name: "DAB FIG 1/0 ensemble label",
        fields: [
          { label: "FIG type / length", value: `1 / ${body.length}`, offset: 0, length: 1 },
          { label: "Charset / extension", value: "0 EBU Latin, extension 0 (low nibble)", offset: 1, length: 1 },
          { label: "EId", value: "0x4E09", offset: 2, length: 2 },
          { label: "Character flags", value: "0xFFFF", offset: 4, length: 2 },
          { label: "Label", value: label.trimEnd(), offset: 6, length: 16 },
        ],
      },
    ],
  });
}

function ts(pid: number, cc: number, pusi: boolean, payload: number[]): Uint8Array {
  const pkt = new Uint8Array(188);
  pkt[0] = 0x47;
  pkt[1] = (pusi ? 0x40 : 0) | ((pid >> 8) & 0x1f);
  pkt[2] = pid & 255;
  pkt[3] = 0x10 | (cc & 0x0f);
  pkt.set(payload.slice(0, 184), 4);
  return pkt;
}

function patFrame(bench: Bench, rel: number): FrameDraft {
  const section = [
    0x00,
    0x00,
    0xb0, 0x0d,
    0x00, 0x01,
    0xc1,
    0x00, 0x00,
    0x00, 0x01,
    0xe1, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ];
  const bytes = ts(0, bench.ccPat, true, section);
  return draft({
    rel,
    src: "mux",
    dst: "PID 0",
    proto: "MPEG-TS",
    info: `PAT, cc ${bench.ccPat}, program 1 → PID 256`,
    origin: "bench",
    domain: "tv",
    srcNode: "dvb",
    dstNode: "pat",
    bytes,
    layers: [
      {
        name: "MPEG-TS",
        fields: [
          { label: "Sync", value: "0x47", offset: 0, length: 1 },
          { label: "PID", value: "0", offset: 1, length: 2 },
          { label: "Continuity", value: String(bench.ccPat & 0x0f), offset: 3, length: 1 },
          { label: "Pointer", value: "0", offset: 4, length: 1 },
          { label: "Table id", value: "PAT (0x00)", offset: 5, length: 1 },
          { label: "Program 1 map PID", value: "256", offset: 15, length: 2 },
          { label: "CRC32", value: "bench, not computed", offset: 17, length: 4 },
        ],
      },
    ],
  });
}

function pes(bench: Bench, rel: number, pid: number, cc: number, stream: number, node: string, info: string): FrameDraft {
  const payload = [0x00, 0x00, 0x00, 0x01, stream, 0x00, 0x00, 0x80, 0x00, 0x00, 0x4e, 0x09];
  const bytes = ts(pid, cc, true, payload);
  return draft({
    rel,
    src: "mux",
    dst: `PID ${pid}`,
    proto: "MPEG-TS",
    info,
    origin: "bench",
    domain: "tv",
    srcNode: "dvb",
    dstNode: node,
    bytes,
    layers: [
      {
        name: "MPEG-TS + PES",
        fields: [
          { label: "Sync", value: "0x47", offset: 0, length: 1 },
          { label: "PUSI / PID", value: `start, PID ${pid}`, offset: 1, length: 2 },
          { label: "Continuity", value: String(cc & 0x0f), offset: 3, length: 1 },
          { label: "PES start", value: "00 00 01", offset: 4, length: 4 },
          { label: "Stream id", value: `0x${hexByte(stream)}`, offset: 8, length: 1 },
        ],
      },
    ],
  });
}

export function nextBenchFrame(bench: Bench, now: number): FrameDraft {
  const rel = Math.max(0, (now - bench.t0) / 1000);
  const kind = bench.kind % 10;
  bench.kind += 1;
  bench.seq = (bench.seq + 1) & 0xfff;
  bench.ipId = (bench.ipId + 1) & 0xffff;
  let frame: FrameDraft;
  switch (kind) {
    case 0:
      frame = beacon(bench, rel);
      break;
    case 1:
      frame = probe(bench, rel);
      break;
    case 2:
      frame = dhcp(bench, rel);
      break;
    case 3:
      frame = dns(bench, rel);
      break;
    case 4:
      frame = tcpSyn(bench, rel);
      bench.tcpSport = 48000 + (bench.tcpSport + 1) % 4000;
      bench.tcpSeq = (bench.tcpSeq + 1) >>> 0;
      break;
    case 5:
      frame = bleAdv(rel);
      break;
    case 6:
      frame = attRead(rel);
      break;
    case 7:
      frame = rds(bench, rel);
      bench.psSeg = (bench.psSeg + 1) & 3;
      break;
    case 8:
      frame = dab(rel);
      break;
    default: {
      const flip = bench.kind % 3;
      if (flip === 0) {
        frame = patFrame(bench, rel);
        bench.ccPat = (bench.ccPat + 1) & 0x0f;
      } else if (flip === 1) {
        frame = pes(bench, rel, 256, bench.ccVideo, 0xe0, "video", `Video PES, PID 256, cc ${bench.ccVideo}`);
        bench.ccVideo = (bench.ccVideo + 1) & 0x0f;
      } else {
        frame = pes(bench, rel, 257, bench.ccAudio, 0xc0, "tvaudio", `Audio PES, PID 257, cc ${bench.ccAudio}`);
        bench.ccAudio = (bench.ccAudio + 1) & 0x0f;
      }
    }
  }
  return frame;
}

function textFrame(opts: {
  rel: number;
  proto: string;
  info: string;
  origin: Origin;
  domain: Domain;
  src: string;
  dst: string;
  srcNode: string;
  dstNode: string;
  layer: string;
  source: Source;
  lines: { label: string; value: string }[];
}): FrameDraft {
  return draft({
    rel: opts.rel,
    src: opts.src,
    dst: opts.dst,
    proto: opts.proto,
    info: opts.info,
    origin: opts.origin,
    domain: opts.domain,
    srcNode: opts.srcNode,
    dstNode: opts.dstNode,
    bytes: null,
    source: opts.source,
    layers: [
      {
        name: opts.layer,
        fields: opts.lines.map((line) => ({ label: line.label, value: line.value, offset: 0, length: 0 })),
      },
    ],
  });
}

export function hostLinkFrame(
  rel: number,
  sample: {
    online: boolean;
    effectiveType: string | null;
    type: string | null;
    downlink: number | null;
    rtt: number | null;
    saveData: boolean;
    klass: string;
  },
): FrameDraft {
  const down = sample.downlink == null ? "n/a" : String(sample.downlink);
  const rtt = sample.rtt == null ? "n/a" : String(sample.rtt);
  const kind = sample.effectiveType ?? "n/a";
  return textFrame({
    rel,
    proto: "HOST",
    info: `Link ${kind}, ${down} Mb/s, rtt ${rtt} ms`,
    origin: "host",
    domain: "link",
    src: "host",
    dst: "link",
    srcNode: "host",
    dstNode: "nic",
    source: "LIVE_WEB_LINK",
    layer: "Browser link telemetry — not a Wi-Fi scan",
    lines: [
      { label: "online", value: String(sample.online) },
      { label: "effectiveType", value: kind },
      { label: "type", value: sample.type ?? "n/a" },
      { label: "downlinkMbps", value: down },
      { label: "rttMs", value: rtt },
      { label: "saveData", value: String(sample.saveData) },
      { label: "class", value: sample.klass },
    ],
  });
}

export function radioObsFrame(rel: number, peakHz: number, rms: number): FrameDraft {
  return textFrame({
    rel,
    proto: "AUDIO",
    info: `Mic peak ${peakHz.toFixed(0)} Hz, rms ${rms.toFixed(3)}`,
    origin: "host",
    domain: "radio",
    src: "mic",
    dst: "front-end",
    srcNode: "host",
    dstNode: "audio",
    source: "LIVE_AUDIO",
    layer: "Audio spectrum",
    lines: [
      { label: "peakHz", value: peakHz.toFixed(1) },
      { label: "rms", value: rms.toFixed(4) },
      { label: "path", value: "getUserMedia analyser, not an RF tuner" },
    ],
  });
}

export function rasterObsFrame(
  rel: number,
  sample: { luma: number; chroma: number; motion: number; mode: string },
): FrameDraft {
  return textFrame({
    rel,
    proto: "RASTER",
    info: `${sample.mode} luma ${sample.luma.toFixed(0)} motion ${sample.motion.toFixed(1)}`,
    origin: "host",
    domain: "tv",
    src: sample.mode,
    dst: "picture",
    srcNode: "host",
    dstNode: "picture",
    source: "LIVE_CAMERA",
    layer: sample.mode === "display"
      ? "Display capture — raw frames are not retained. This is not a DVB tuner."
      : "Camera meter — raw frames are not retained. A visible object is not an access point.",
    lines: [
      { label: "mode", value: sample.mode },
      { label: "luma", value: sample.luma.toFixed(1) },
      { label: "chromaRB", value: sample.chroma.toFixed(1) },
      { label: "motion", value: sample.motion.toFixed(2) },
    ],
  });
}

export function hostInventoryFrame(
  rel: number,
  lines: { label: string; value: string }[],
): FrameDraft {
  return textFrame({
    rel,
    proto: "HOST",
    info: "Host inventory",
    origin: "host",
    domain: "host",
    src: "host",
    dst: "host",
    srcNode: "host",
    dstNode: "host",
    source: "LIVE_HOST",
    layer: "Host inventory",
    lines,
  });
}

export function bleAttachFrame(rel: number, name: string, battery: number | null): FrameDraft {
  return textFrame({
    rel,
    proto: "BLE",
    info: `User-selected device ${name}`,
    origin: "host",
    domain: "ble",
    src: name,
    dst: "host",
    srcNode: "host",
    dstNode: "ble",
    source: "LIVE_WEB_BLUETOOTH",
    layer: "Web Bluetooth selection — not an advertisement scan",
    lines: [
      { label: "name", value: name },
      { label: "battery", value: battery == null ? "not exposed" : String(battery) },
      { label: "raw", value: "advertisement bytes are not exposed by this API" },
    ],
  });
}

export function usbDeviceFrame(
  rel: number,
  device: { vendorId: number; productId: number; productName: string | null },
): FrameDraft {
  const id = `${device.vendorId.toString(16)}:${device.productId.toString(16)}`;
  return textFrame({
    rel,
    proto: "USB",
    info: `USB ${id}${device.productName ? ` ${device.productName}` : ""}`,
    origin: "host",
    domain: "host",
    src: id,
    dst: "host",
    srcNode: "host",
    dstNode: `usb-${device.vendorId}-${device.productId}`,
    source: "LIVE_USB",
    layer: "USB device — no RF or DVB driver loaded",
    lines: [
      { label: "vendorId", value: `0x${device.vendorId.toString(16)}` },
      { label: "productId", value: `0x${device.productId.toString(16)}` },
      { label: "productName", value: device.productName ?? "unpublished" },
      { label: "owner", value: "UNKNOWN" },
    ],
  });
}

export function rdapObsFrame(
  rel: number,
  query: string,
  summary: string,
): FrameDraft {
  const id = `rdap-${query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "query"}`;
  return textFrame({
    rel,
    proto: "RDAP",
    info: summary,
    origin: "host",
    domain: "stack",
    src: "rdap",
    dst: query,
    srcNode: "host",
    dstNode: id,
    source: "OPEN_DATA_RDAP",
    layer: "RDAP — registry data, not device ownership",
    lines: [
      { label: "query", value: query },
      { label: "claim", value: "ADDRESS_REGISTRANT" },
      { label: "summary", value: summary },
      { label: "not", value: "Not a device owner, not a router owner" },
    ],
  });
}

export function browserWindowFrame(rel: number, browser: string, url: string): FrameDraft {
  return textFrame({
    rel,
    proto: "WINDOW",
    info: `${browser} window opened`,
    origin: "host",
    domain: "link",
    src: "host",
    dst: browser,
    srcNode: "host",
    dstNode: "browser",
    source: "USER_ASSERTED",
    layer: "Window — same browser, not a tunnel",
    lines: [
      { label: "browser", value: browser },
      { label: "url", value: url },
      { label: "tunnel", value: "none" },
    ],
  });
}

export function userLinkFrame(rel: number, nodeId: string, label: string): FrameDraft {
  return textFrame({
    rel,
    proto: "USER",
    info: `User linked the visible scene to ${label}`,
    origin: "host",
    domain: "host",
    src: "user",
    dst: label,
    srcNode: "host",
    dstNode: nodeId,
    source: "USER_ASSERTED",
    layer: "User assertion — not a visual identification",
    lines: [
      { label: "claim", value: "USER_LINKED" },
      { label: "entity", value: nodeId },
      { label: "note", value: "The camera did not identify this entity." },
    ],
  });
}
