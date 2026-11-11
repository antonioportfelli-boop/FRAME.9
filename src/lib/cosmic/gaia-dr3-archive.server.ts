import { createHash } from "node:crypto";
import { importGaiaDr3Csv } from "./gaia-dr3-importer.ts";
import {
  GAIA_DR3_ARCHIVE_URI,
  GAIA_DR3_QUERY_SELECTION,
  GAIA_DR3_SAMPLE_LIMIT,
  GAIA_DR3_SAMPLE_QUERY,
  GAIA_DR3_TAP_ENDPOINT,
} from "./gaia-dr3-query.ts";
import type { CosmicGraphSnapshot } from "./contracts.ts";
import type { GaiaRefreshManifest, GaiaRefreshPayload } from "./gaia-dr3-refresh-types.ts";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_GAP_MS = 15 * 1000;
const TAP_TIMEOUT_MS = 8 * 1000;
const JOB_DEADLINE_MS = 30 * 1000;
const MAX_CSV_CHARS = 48_000;
const MAX_UWS_TEXT_CHARS = 32_000;
const USER_AGENT = "FRAME.9-gaia-dr3/1.0 (+https://github.com/antonioportfelli-boop/FRAME.9)";

export class GaiaArchiveError extends Error {
  constructor(
    readonly code: "RATE_LIMITED" | "ARCHIVE_UNAVAILABLE" | "ARCHIVE_TIMEOUT" | "RESPONSE_INVALID",
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GaiaArchiveError";
  }
}

let cached: { payload: GaiaRefreshPayload; expiresAt: number } | null = null;
let lastRequestStartedAt = 0;

function canonicalCsv(input: string): string {
  return `${input.replace(/\r\n?/g, "\n").replace(/\n+$/g, "")}\n`;
}

async function readBoundedText(response: Response, maxChars: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new GaiaArchiveError("RESPONSE_INVALID", "Gaia Archive returned an empty response.", 502);
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      if (text.length > maxChars) {
        await reader.cancel();
        throw new GaiaArchiveError("RESPONSE_INVALID", "Gaia Archive response exceeded the importer limit.", 502);
      }
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  if (text.length > maxChars) {
    throw new GaiaArchiveError("RESPONSE_INVALID", "Gaia Archive response exceeded the importer limit.", 502);
  }
  return text;
}

function safeJobId(body: string): string | null {
  const match = body.match(/<(?:[A-Za-z0-9_.-]+:)?jobId\b[^>]*>\s*(?:<!\[CDATA\[)?([^<\]]+)/i);
  const jobId = match?.[1]?.trim();
  return jobId && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}-O$/i.test(jobId)
    ? jobId
    : null;
}

async function tapFetch(url: string, init?: RequestInit, timeoutMs = TAP_TIMEOUT_MS): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/csv, text/plain, application/xml;q=0.9",
        ...init?.headers,
      },
      signal: AbortSignal.timeout(Math.min(TAP_TIMEOUT_MS, timeoutMs)),
      redirect: "error",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new GaiaArchiveError("ARCHIVE_TIMEOUT", "Gaia Archive response timed out. The committed snapshot is still available.", 504);
    }
    throw new GaiaArchiveError("ARCHIVE_UNAVAILABLE", "Gaia Archive could not be reached. Try again later.", 502);
  }
}

async function submitQuery(): Promise<string> {
  const body = new URLSearchParams({
    REQUEST: "doQuery",
    LANG: "ADQL",
    FORMAT: "csv",
    QUERY: GAIA_DR3_SAMPLE_QUERY,
    PHASE: "RUN",
    MAXREC: String(GAIA_DR3_SAMPLE_LIMIT),
  });
  const response = await tapFetch(`${GAIA_DR3_TAP_ENDPOINT}/async`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const responseBody = await readBoundedText(response, MAX_UWS_TEXT_CHARS);
  if (!response.ok) {
    throw new GaiaArchiveError("ARCHIVE_UNAVAILABLE", "Gaia Archive rejected the bounded query.", 502);
  }
  const jobId = safeJobId(responseBody);
  if (!jobId) {
    throw new GaiaArchiveError("RESPONSE_INVALID", "Gaia Archive returned an unrecognized job response.", 502);
  }
  return jobId;
}

async function cancelJob(jobId: string): Promise<void> {
  try {
    await fetch(`${GAIA_DR3_TAP_ENDPOINT}/async/${jobId}`, {
      method: "DELETE",
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(2000),
      redirect: "error",
    });
  } catch {
    // Cancellation is best-effort; no remote response is exposed to the client.
  }
}

async function waitForJob(jobId: string): Promise<void> {
  const phaseUrl = `${GAIA_DR3_TAP_ENDPOINT}/async/${jobId}/phase`;
  const deadline = Date.now() + JOB_DEADLINE_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;
    const response = await tapFetch(phaseUrl, undefined, remainingMs);
    if (!response.ok) {
      throw new GaiaArchiveError("ARCHIVE_UNAVAILABLE", "Gaia Archive job status could not be read.", 502);
    }
    const phase = (await readBoundedText(response, 128)).trim().toUpperCase();
    if (phase === "COMPLETED") return;
    if (phase === "ERROR" || phase === "ABORTED") {
      throw new GaiaArchiveError("ARCHIVE_UNAVAILABLE", "Gaia Archive could not complete the query.", 502);
    }
    if (phase !== "PENDING" && phase !== "QUEUED" && phase !== "EXECUTING" && phase !== "HELD") {
      throw new GaiaArchiveError("RESPONSE_INVALID", "Gaia Archive returned an unknown job state.", 502);
    }
  }
  throw new GaiaArchiveError("ARCHIVE_TIMEOUT", "The Gaia query took too long. The archived snapshot is still available.", 504);
}

async function readResult(jobId: string): Promise<string> {
  const response = await tapFetch(`${GAIA_DR3_TAP_ENDPOINT}/async/${jobId}/results/result`);
  if (!response.ok) {
    throw new GaiaArchiveError("ARCHIVE_UNAVAILABLE", "Gaia Archive results could not be downloaded.", 502);
  }
  const csv = canonicalCsv(await readBoundedText(response, MAX_CSV_CHARS));
  if (csv.length > MAX_CSV_CHARS) {
    await cancelJob(jobId);
    throw new GaiaArchiveError("RESPONSE_INVALID", "Gaia Archive returned more data than the importer allows.", 502);
  }
  const rowCount = Math.max(0, csv.trim().split(/\r?\n/).length - 1);
  if (rowCount !== GAIA_DR3_SAMPLE_LIMIT) {
    throw new GaiaArchiveError("RESPONSE_INVALID", "Gaia Archive returned an incomplete sample; the prior snapshot was kept.", 502);
  }
  return csv;
}

function sha256(csv: string): string {
  return createHash("sha256").update(csv, "utf8").digest("hex");
}

function cachedResult(now: number): GaiaRefreshPayload | null {
  if (!cached || cached.expiresAt <= now) return null;
  return {
    ...cached.payload,
    manifest: { ...cached.payload.manifest, cache: "SERVER_CACHE" },
  };
}

export async function refreshGaiaDr3Snapshot(): Promise<GaiaRefreshPayload> {
  const now = Date.now();
  const fromCache = cachedResult(now);
  if (fromCache) return fromCache;
  if (now - lastRequestStartedAt < REQUEST_GAP_MS) {
    throw new GaiaArchiveError("RATE_LIMITED", "Please wait before checking Gaia Archive again.", 429);
  }
  lastRequestStartedAt = now;

  let jobId: string | null = null;
  try {
    jobId = await submitQuery();
    await waitForJob(jobId);
    const csv = await readResult(jobId);
    const retrievedAt = new Date().toISOString();
    const revision = `gaia-dr3:${jobId}`;
    const imported = importGaiaDr3Csv(csv, {
      retrievedAt,
      datasetId: "gaia-dr3-random-index-sample-64",
      datasetRevision: revision,
    });
    if (!imported.ok) {
      throw new GaiaArchiveError("RESPONSE_INVALID", "Gaia Archive rows failed CSE validation; the prior snapshot was kept.", 502);
    }
    const expiresAt = Date.now() + CACHE_TTL_MS;
    const payload: GaiaRefreshPayload = {
      snapshot: imported.value,
      manifest: {
        dataset: "Gaia DR3",
        table: "gaiadr3.gaia_source",
        archive: GAIA_DR3_ARCHIVE_URI,
        tapEndpoint: `${GAIA_DR3_TAP_ENDPOINT}/async`,
        jobId,
        retrievedAt,
        rowCount: imported.value.entities.length,
        query: GAIA_DR3_SAMPLE_QUERY,
        selection: GAIA_DR3_QUERY_SELECTION,
        sha256: sha256(csv),
        attribution: "Credit ESA, Gaia, and DPAC; see official Gaia DR3 credit and citation instructions.",
        cache: "ESA_TAP",
        cacheValidUntil: new Date(expiresAt).toISOString(),
      },
    };
    cached = { payload, expiresAt };
    return payload;
  } catch (error) {
    if (jobId) await cancelJob(jobId);
    if (error instanceof GaiaArchiveError) throw error;
    throw new GaiaArchiveError("ARCHIVE_UNAVAILABLE", "Gaia Archive refresh failed; the prior snapshot was kept.", 502);
  }
}
