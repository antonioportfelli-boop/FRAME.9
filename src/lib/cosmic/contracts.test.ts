import assert from "node:assert/strict";
import test from "node:test";
import {
  CSE_SCHEMA_VERSION,
  cognitiveStateKey,
  validateAstrometricMeasurements,
  validateCelestialEntity,
  validateCognitiveState,
  validateCosmicGraphSnapshot,
  validateSourceReference,
} from "./contracts.ts";

const source = () => ({
  id: "src-gaia-dr3",
  provider: "example-catalog",
  resource: "catalog:gaia-dr3/object/123",
  revision: "dr3",
  uri: "https://example.org/catalog/gaia-dr3",
  retrievedAt: "2026-11-11T00:00:00Z",
  licenseId: "example-license",
});

const entity = (id: string, kind: "STAR" | "GALAXY" | "NEBULA" = "STAR") => ({
  id, kind, name: id, aliases: [], evidenceState: "OBSERVED",
  sourceRefs: [source()],
  cognitiveState: { axisA: 0, axisB: 1, axisC: 2 },
  position: { frame: "ICRS", longitudeDeg: 120, latitudeDeg: 25, epoch: "J2000.0" },
});

const graph = () => ({
  schemaVersion: CSE_SCHEMA_VERSION,
  datasetId: "beruvian-demo",
  datasetRevision: "0.1.0",
  generatedAt: "2026-11-11T00:00:00Z",
  entities: [entity("star-1"), entity("galaxy-1", "GALAXY")],
  relations: [{
    id: "rel-1", fromEntityId: "star-1", predicate: "located_in",
    toEntityId: "galaxy-1", evidenceState: "INFERRED", sourceRefs: [source()],
  }],
});

test("accepts a valid source-backed celestial graph", () => {
  const checked = validateCosmicGraphSnapshot(graph());
  assert.equal(checked.ok, true);
  if (checked.ok) {
    assert.equal(checked.value.entities.length, 2);
    assert.equal(checked.value.relations.length, 1);
  }
});

test("source references require valid UTC time and HTTP(S) URI", () => {
  assert.equal(validateSourceReference(source()).ok, true);
  assert.equal(validateSourceReference({ ...source(), retrievedAt: "2026-02-30T00:00:00Z" }).ok, false);
  assert.equal(validateSourceReference({ ...source(), uri: "file:///etc/passwd" }).ok, false);
});

test("preserves Gaia-style astrometry with explicit epoch and units", () => {
  const astrometry = {
    referenceEpochJulianYear: 2016.0,
    timeScale: "TCB",
    raErrorMas: 0.2,
    decErrorMas: 0.3,
    parallaxMas: -0.15,
    parallaxErrorMas: 0.1,
    pmRaMasPerYear: -12.4,
    pmDecMasPerYear: 7.8,
  };
  assert.equal(validateAstrometricMeasurements(astrometry).ok, true);
  assert.equal(validateAstrometricMeasurements({
    ...astrometry, referenceEpochJulianYear: Number.NaN,
  }).ok, false);
  assert.equal(validateAstrometricMeasurements({
    ...astrometry, raErrorMas: -0.1,
  }).ok, false);
  const inconsistent = {
    ...entity("gaia-source-bad"),
    position: { frame: "GALACTIC", longitudeDeg: 120, latitudeDeg: 25, epoch: "2016.0 TCB" },
    astrometry,
  };
  assert.equal(validateCelestialEntity(inconsistent).ok, false);
});

test("rejects invalid coordinate ranges and non-finite values", () => {
  assert.equal(validateCelestialEntity(entity("star-ok")).ok, true);
  assert.equal(validateCelestialEntity({
    ...entity("gaia-source-123"),
    position: { frame: "ICRS", longitudeDeg: 120, latitudeDeg: 25, epoch: "2016.0 TCB" },
    astrometry: {
      referenceEpochJulianYear: 2016.0, timeScale: "TCB",
      raErrorMas: 0.2, decErrorMas: 0.3, parallaxMas: 1.1, parallaxErrorMas: 0.1,
      pmRaMasPerYear: 4.5, pmDecMasPerYear: -2.1,
    },
  }).ok, true);
  assert.equal(validateCelestialEntity({
    ...entity("star-bad"),
    position: { frame: "ICRS", longitudeDeg: 20, latitudeDeg: 91, epoch: "J2000.0" },
  }).ok, false);
  assert.equal(validateCelestialEntity({
    ...entity("star-nan"),
    position: { frame: "ICRS", longitudeDeg: Number.NaN, latitudeDeg: 0, epoch: null },
  }).ok, false);
});

test("rejects duplicate entities and dangling relation endpoints", () => {
  const duplicate = graph();
  duplicate.entities.push(entity("star-1"));
  const duplicateResult = validateCosmicGraphSnapshot(duplicate);
  assert.equal(duplicateResult.ok, false);
  if (!duplicateResult.ok) assert.equal(duplicateResult.reason, "CELESTIAL_ENTITY_DUPLICATE_ID");

  const missingEndpoint = graph();
  missingEndpoint.relations[0] = {
    ...missingEndpoint.relations[0],
    toEntityId: "unknown-object",
  };
  const endpointResult = validateCosmicGraphSnapshot(missingEndpoint);
  assert.equal(endpointResult.ok, false);
  if (!endpointResult.ok) {
    assert.equal(endpointResult.reason, "CELESTIAL_RELATION_ENDPOINT_MISSING");
  }
});

test("the independent three-axis model has exactly 27 states", () => {
  const keys = new Set<string>();
  for (const axisA of [0, 1, 2] as const) {
    for (const axisB of [0, 1, 2] as const) {
      for (const axisC of [0, 1, 2] as const) {
        const state = { axisA, axisB, axisC };
        assert.equal(validateCognitiveState(state).ok, true);
        keys.add(cognitiveStateKey(state));
      }
    }
  }
  assert.equal(keys.size, 27);
  assert.equal(validateCognitiveState({ axisA: 3, axisB: 0, axisC: 0 }).ok, false);
});

test("synthetic evidence remains explicitly synthetic", () => {
  const synthetic = { ...entity("generated-nebula", "NEBULA"), evidenceState: "SYNTHETIC" };
  const checked = validateCelestialEntity(synthetic);
  assert.equal(checked.ok, true);
  if (checked.ok) assert.equal(checked.value.evidenceState, "SYNTHETIC");
});
