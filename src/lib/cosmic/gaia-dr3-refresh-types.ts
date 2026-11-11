import type { CosmicGraphSnapshot } from "./contracts.ts";

export type GaiaRefreshManifest = Readonly<{
  dataset: "Gaia DR3";
  table: "gaiadr3.gaia_source";
  archive: string;
  tapEndpoint: string;
  jobId: string;
  retrievedAt: string;
  rowCount: number;
  query: string;
  selection: string;
  sha256: string;
  attribution: string;
  cache: "ESA_TAP" | "SERVER_CACHE";
  cacheValidUntil: string;
}>;

export type GaiaRefreshPayload = Readonly<{
  snapshot: CosmicGraphSnapshot;
  manifest: GaiaRefreshManifest;
}>;
