import gaiaCsv from "./fixtures/gaia-dr3-cse02-sample.csv?raw";
import manifest from "./fixtures/gaia-dr3-cse02-manifest.json";
import {
  CSE_SCHEMA_VERSION,
  validateCosmicGraphSnapshot,
  type CognitiveState,
  type CosmicGraphSnapshot,
  type ValidationResult,
} from "./contracts.ts";
import { mapGaiaDr3Source, type GaiaDr3CsvRow } from "./gaia-dr3.ts";

const MAX_SAMPLE_ROWS = 64;
const DISPLAY_NEUTRAL_STATE: CognitiveState = { axisA: 1, axisB: 1, axisC: 1 };
const HEADERS = [
  "source_id", "designation", "ref_epoch", "ra", "dec", "ra_error", "dec_error",
  "parallax", "parallax_error", "pmra", "pmdec",
];

function parseCsvLine(line: string): string[] | null {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  if (quoted) return null;
  values.push(value);
  return values;
}

export function importGaiaDr3Csv(
  csv: string,
  retrievedAt: string,
): ValidationResult<CosmicGraphSnapshot> {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2 || lines.length - 1 > MAX_SAMPLE_ROWS) {
    return { ok: false, reason: "GAIA_DR3_SAMPLE_SIZE_INVALID" };
  }
  const header = parseCsvLine(lines[0] ?? "");
  if (!header || header.length !== HEADERS.length ||
      header.some((field, index) => field !== HEADERS[index])) {
    return { ok: false, reason: "GAIA_DR3_SAMPLE_HEADER_INVALID" };
  }

  const entities = [];
  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    if (!values || values.length !== HEADERS.length) {
      return { ok: false, reason: "GAIA_DR3_SAMPLE_ROW_INVALID" };
    }
    const row = Object.fromEntries(HEADERS.map((field, index) => [
      field,
      values[index] === "" ? null : values[index],
    ])) as GaiaDr3CsvRow;
    const mapped = mapGaiaDr3Source(row, {
      retrievedAt,
      cognitiveState: DISPLAY_NEUTRAL_STATE,
    });
    if (!mapped.ok) return mapped;
    entities.push(mapped.value);
  }

  return validateCosmicGraphSnapshot({
    schemaVersion: CSE_SCHEMA_VERSION,
    datasetId: "gaia-dr3-random-index-sample-64",
    datasetRevision: `gaia-dr3:${manifest.jobId}`,
    generatedAt: retrievedAt,
    entities,
    relations: [],
  });
}

const imported = importGaiaDr3Csv(gaiaCsv, manifest.retrievedAt);
if (!imported.ok) throw new Error(`Gaia DR3 sample rejected: ${imported.reason}`);

export const gaiaDr3SampleManifest = manifest;
export const gaiaDr3Sample: CosmicGraphSnapshot = imported.value;
