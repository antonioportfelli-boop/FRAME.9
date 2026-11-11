import gaiaCsv from "./fixtures/gaia-dr3-cse02-sample.csv?raw";
import manifest from "./fixtures/gaia-dr3-cse02-manifest.json";
import type { CosmicGraphSnapshot } from "./contracts.ts";
import { importGaiaDr3Csv } from "./gaia-dr3-importer.ts";
import { GAIA_DR3_SAMPLE_QUERY } from "./gaia-dr3-query.ts";

const imported = importGaiaDr3Csv(gaiaCsv, {
  retrievedAt: manifest.retrievedAt,
  datasetRevision: `gaia-dr3:${manifest.jobId}`,
});
if (manifest.query !== GAIA_DR3_SAMPLE_QUERY) {
  throw new Error("Gaia DR3 fixture query does not match the shared bounded query definition.");
}
if (!imported.ok) throw new Error(`Gaia DR3 sample rejected: ${imported.reason}`);

export const gaiaDr3SampleManifest = manifest;
export const gaiaDr3Sample: CosmicGraphSnapshot = imported.value;
