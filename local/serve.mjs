import { createServer } from "node:http";
import { spawn, execFile } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = existsSync(join(here, ".vercel/output/static")) ? here : join(here, "..");
const staticRoot = join(root, ".vercel/output/static");
const port = 4173;
const handler = (await import(join(root, ".vercel/output/functions/__server.func/index.mjs"))).default;

const types = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".zip": "application/zip",
  ".webmanifest": "application/manifest+json",
};

function staticFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  if (decoded.includes("\0")) return null;
  const file = normalize(join(staticRoot, decoded));
  if (!file.startsWith(staticRoot)) return null;
  if (!existsSync(file) || !statSync(file).isFile()) return null;
  return file;
}

function wireStatus() {
  return new Promise((resolve) => {
    execFile("wg", ["show", "all", "dump"], { timeout: 2000 }, (error, stdout) => {
      if (error) {
        resolve({ up: false, line: "WireGuard ei ole selles masinas käivitatud. Tunnel on väljas." });
        return;
      }
      const lines = stdout.trim().split("\n").filter(Boolean);
      const parts = [];
      for (const line of lines) {
        const field = line.split("\t");
        if (field.length >= 8) {
          const handshake = Number(field[4]);
          parts.push(handshake > 0 ? `ühendus olemas, viimane käepigistus ${new Date(handshake * 1000).toISOString()}` : "liides on üleval, käepigistust pole");
        }
      }
      resolve({
        up: parts.some((item) => item.startsWith("ühendus olemas")),
        line: parts.join(" · ") || "wg vastas. Ühtegi käepigistust ei ole. Tunnel on väljas.",
      });
    });
  });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
    if (url.pathname === "/frame9-wire") {
      const status = await wireStatus();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify(status));
      return;
    }
    const file = req.method === "GET" || req.method === "HEAD" ? staticFile(url.pathname) : null;
    if (file) {
      const ext = file.slice(file.lastIndexOf("."));
      res.setHeader("Content-Type", types[ext] ?? "application/octet-stream");
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      createReadStream(file).pipe(res);
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: body.length && req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
    });
    const response = await handler.fetch(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.statusCode = 500;
    res.end(error instanceof Error ? error.message : "FRAME.9 local server failed");
  }
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log(`FRAME.9 local  ${url}`);
  const opener = process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(opener, args, { detached: true, stdio: "ignore" });
  child.on("error", () => {
    console.log("Open the address above in Chrome, Edge, or Firefox.");
  });
  child.unref();
});
