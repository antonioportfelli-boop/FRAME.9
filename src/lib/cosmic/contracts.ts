/**
 * BERUVIAN NIGHT SKY — Cosmic Semantic Engine (CSE-01)
 *
 * Versioned, source-backed contracts only. This module does not infer
 * astronomical facts, convert coordinate frames, or assign physical meaning
 * to the separate cognitive-state axes.
 */
export const CSE_SCHEMA_VERSION = "cse-01/v0.1" as const;

export const CELESTIAL_ENTITY_KINDS = [
  "STAR", "PLANET", "MOON", "GALAXY", "NEBULA", "STAR_CLUSTER", "CONSTELLATION", "OTHER",
] as const;
export const EVIDENCE_STATES = [
  "OBSERVED", "DERIVED", "INFERRED", "SYNTHETIC", "UNVERIFIED",
] as const;
export const COORDINATE_FRAMES = [
  "ICRS", "GALACTIC", "ECLIPTIC", "LOCAL_HORIZON",
] as const;

export type CelestialEntityKind = (typeof CELESTIAL_ENTITY_KINDS)[number];
export type EvidenceState = (typeof EVIDENCE_STATES)[number];
export type CoordinateFrame = (typeof COORDINATE_FRAMES)[number];
export type CognitiveAxisValue = 0 | 1 | 2;

/** These axes are separate from celestial coordinates and physical measurements. */
export type CognitiveState = Readonly<{
  axisA: CognitiveAxisValue;
  axisB: CognitiveAxisValue;
  axisC: CognitiveAxisValue;
}>;

export type SourceReference = Readonly<{
  id: string;
  provider: string;
  resource: string;
  revision: string | null;
  uri: string | null;
  retrievedAt: string;
  licenseId: string | null;
}>;

export type CelestialPosition = Readonly<{
  frame: CoordinateFrame;
  longitudeDeg: number;
  latitudeDeg: number;
  epoch: string | null;
}>;

export type AstrometricMeasurements = Readonly<{
  referenceEpochJulianYear: number;
  timeScale: "TCB";
  /** Gaia's published ra_error is sigma(alpha*) = sigma(alpha) * cos(dec). */
  raErrorMas: number | null;
  decErrorMas: number | null;
  parallaxMas: number | null;
  parallaxErrorMas: number | null;
  /** Gaia pmra is mu(alpha*) = mu(alpha) * cos(dec), in mas/year. */
  pmRaMasPerYear: number | null;
  pmDecMasPerYear: number | null;
}>;

export type CelestialEntity = Readonly<{
  id: string;
  kind: CelestialEntityKind;
  name: string;
  aliases: readonly string[];
  evidenceState: EvidenceState;
  sourceRefs: readonly SourceReference[];
  cognitiveState: CognitiveState;
  position?: CelestialPosition;
  astrometry?: AstrometricMeasurements;
}>;

export type CelestialRelation = Readonly<{
  id: string;
  fromEntityId: string;
  predicate: string;
  toEntityId: string;
  evidenceState: EvidenceState;
  sourceRefs: readonly SourceReference[];
}>;

export type CosmicGraphSnapshot = Readonly<{
  schemaVersion: typeof CSE_SCHEMA_VERSION;
  datasetId: string;
  datasetRevision: string;
  generatedAt: string;
  entities: readonly CelestialEntity[];
  relations: readonly CelestialRelation[];
}>;

export type ValidationResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; reason: string }>;

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const ENTITY_KIND_SET = new Set<string>(CELESTIAL_ENTITY_KINDS);
const EVIDENCE_STATE_SET = new Set<string>(EVIDENCE_STATES);
const COORDINATE_FRAME_SET = new Set<string>(COORDINATE_FRAMES);
const MAX_ENTITIES = 100_000;
const MAX_RELATIONS = 500_000;
const MAX_SOURCES_PER_RECORD = 16;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean {
  const allowed = new Set([...required, ...optional]);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string" || !allowed.has(key))) return false;
  if (required.some((key) => !Object.hasOwn(value, key))) return false;
  return keys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return Boolean(descriptor && "value" in descriptor && !descriptor.get && !descriptor.set);
  });
}

function isId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

function isNonEmptyText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 &&
    value.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(value);
}

function isIsoUtc(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_UTC_PATTERN.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().startsWith(value.slice(0, 19));
}

export function isCognitiveAxisValue(value: unknown): value is CognitiveAxisValue {
  return value === 0 || value === 1 || value === 2;
}

export function validateCognitiveState(input: unknown): ValidationResult<CognitiveState> {
  if (!isRecord(input) || !hasOnlyKeys(input, ["axisA", "axisB", "axisC"])) {
    return { ok: false, reason: "COGNITIVE_STATE_SHAPE_INVALID" };
  }
  if (!isCognitiveAxisValue(input.axisA) ||
      !isCognitiveAxisValue(input.axisB) ||
      !isCognitiveAxisValue(input.axisC)) {
    return { ok: false, reason: "COGNITIVE_STATE_AXIS_INVALID" };
  }
  return { ok: true, value: { axisA: input.axisA, axisB: input.axisB, axisC: input.axisC } };
}

export function cognitiveStateKey(state: CognitiveState): string {
  return `${state.axisA}-${state.axisB}-${state.axisC}`;
}

export function validateSourceReference(input: unknown): ValidationResult<SourceReference> {
  const required = ["id", "provider", "resource", "revision", "uri", "retrievedAt", "licenseId"];
  if (!isRecord(input) || !hasOnlyKeys(input, required)) {
    return { ok: false, reason: "SOURCE_REFERENCE_SHAPE_INVALID" };
  }
  if (!isId(input.id) || !isNonEmptyText(input.provider, 128) ||
      !isNonEmptyText(input.resource, 512) ||
      !(input.revision === null || isNonEmptyText(input.revision, 256)) ||
      !(input.uri === null || isNonEmptyText(input.uri, 2048)) ||
      !isIsoUtc(input.retrievedAt) ||
      !(input.licenseId === null || isNonEmptyText(input.licenseId, 128))) {
    return { ok: false, reason: "SOURCE_REFERENCE_VALUE_INVALID" };
  }
  if (typeof input.uri === "string") {
    try {
      const parsed = new URL(input.uri);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return { ok: false, reason: "SOURCE_REFERENCE_URI_SCHEME_INVALID" };
      }
    } catch {
      return { ok: false, reason: "SOURCE_REFERENCE_URI_INVALID" };
    }
  }
  return {
    ok: true,
    value: {
      id: input.id, provider: input.provider, resource: input.resource,
      revision: input.revision, uri: input.uri, retrievedAt: input.retrievedAt,
      licenseId: input.licenseId,
    },
  };
}

function validateSourceReferences(input: unknown): ValidationResult<readonly SourceReference[]> {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_SOURCES_PER_RECORD) {
    return { ok: false, reason: "SOURCE_REFERENCES_COUNT_INVALID" };
  }
  const values: SourceReference[] = [];
  const ids = new Set<string>();
  for (const candidate of input) {
    const checked = validateSourceReference(candidate);
    if (!checked.ok) return checked;
    if (ids.has(checked.value.id)) return { ok: false, reason: "SOURCE_REFERENCE_DUPLICATE" };
    ids.add(checked.value.id);
    values.push(checked.value);
  }
  return { ok: true, value: values };
}

function validatePosition(input: unknown): ValidationResult<CelestialPosition> {
  if (!isRecord(input) || !hasOnlyKeys(input, ["frame", "longitudeDeg", "latitudeDeg", "epoch"])) {
    return { ok: false, reason: "CELESTIAL_POSITION_SHAPE_INVALID" };
  }
  if (typeof input.frame !== "string" || !COORDINATE_FRAME_SET.has(input.frame) ||
      typeof input.longitudeDeg !== "number" || !Number.isFinite(input.longitudeDeg) ||
      input.longitudeDeg < 0 || input.longitudeDeg > 360 ||
      typeof input.latitudeDeg !== "number" || !Number.isFinite(input.latitudeDeg) ||
      input.latitudeDeg < -90 || input.latitudeDeg > 90 ||
      !(input.epoch === null || isNonEmptyText(input.epoch, 64))) {
    return { ok: false, reason: "CELESTIAL_POSITION_VALUE_INVALID" };
  }
  return {
    ok: true,
    value: {
      frame: input.frame as CoordinateFrame,
      longitudeDeg: input.longitudeDeg,
      latitudeDeg: input.latitudeDeg,
      epoch: input.epoch,
    },
  };
}

export function validateAstrometricMeasurements(input: unknown): ValidationResult<AstrometricMeasurements> {
  const required = [
    "referenceEpochJulianYear", "timeScale", "raErrorMas", "decErrorMas",
    "parallaxMas", "parallaxErrorMas", "pmRaMasPerYear", "pmDecMasPerYear",
  ];
  if (!isRecord(input) || !hasOnlyKeys(input, required)) {
    return { ok: false, reason: "ASTROMETRY_SHAPE_INVALID" };
  }
  const nullableFinite = (value: unknown) => value === null ||
    (typeof value === "number" && Number.isFinite(value));
  const nullableNonNegative = (value: unknown) => value === null ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0);
  if (typeof input.referenceEpochJulianYear !== "number" ||
      !Number.isFinite(input.referenceEpochJulianYear) ||
      input.referenceEpochJulianYear < 1800 || input.referenceEpochJulianYear > 2500 ||
      input.timeScale !== "TCB" ||
      !nullableNonNegative(input.raErrorMas) ||
      !nullableNonNegative(input.decErrorMas) ||
      !nullableFinite(input.parallaxMas) ||
      !nullableNonNegative(input.parallaxErrorMas) ||
      !nullableFinite(input.pmRaMasPerYear) ||
      !nullableFinite(input.pmDecMasPerYear)) {
    return { ok: false, reason: "ASTROMETRY_VALUE_INVALID" };
  }
  return {
    ok: true,
    value: {
      referenceEpochJulianYear: input.referenceEpochJulianYear,
      timeScale: "TCB",
      raErrorMas: input.raErrorMas,
      decErrorMas: input.decErrorMas,
      parallaxMas: input.parallaxMas,
      parallaxErrorMas: input.parallaxErrorMas,
      pmRaMasPerYear: input.pmRaMasPerYear,
      pmDecMasPerYear: input.pmDecMasPerYear,
    },
  };
}

export function validateCelestialEntity(input: unknown): ValidationResult<CelestialEntity> {
  if (!isRecord(input) || !hasOnlyKeys(
    input,
    ["id", "kind", "name", "aliases", "evidenceState", "sourceRefs", "cognitiveState"],
    ["position", "astrometry"],
  )) {
    return { ok: false, reason: "CELESTIAL_ENTITY_SHAPE_INVALID" };
  }
  if (!isId(input.id) || typeof input.kind !== "string" || !ENTITY_KIND_SET.has(input.kind) ||
      !isNonEmptyText(input.name, 200) ||
      !Array.isArray(input.aliases) || input.aliases.length > 32 ||
      input.aliases.some((alias) => !isNonEmptyText(alias, 200)) ||
      typeof input.evidenceState !== "string" || !EVIDENCE_STATE_SET.has(input.evidenceState)) {
    return { ok: false, reason: "CELESTIAL_ENTITY_VALUE_INVALID" };
  }
  const sources = validateSourceReferences(input.sourceRefs);
  if (!sources.ok) return sources;
  const cognitive = validateCognitiveState(input.cognitiveState);
  if (!cognitive.ok) return cognitive;

  let astrometry: AstrometricMeasurements | undefined;
  if (Object.hasOwn(input, "astrometry")) {
    const checkedAstrometry = validateAstrometricMeasurements(input.astrometry);
    if (!checkedAstrometry.ok) return checkedAstrometry;
    astrometry = checkedAstrometry.value;
  }

  let position: CelestialPosition | undefined;
  if (Object.hasOwn(input, "position")) {
    const checkedPosition = validatePosition(input.position);
    if (!checkedPosition.ok) return checkedPosition;
    position = checkedPosition.value;
  }
  if (astrometry && (!position || position.frame !== "ICRS" ||
      position.epoch !== `${astrometry.referenceEpochJulianYear.toFixed(1)} TCB`)) {
    return { ok: false, reason: "ASTROMETRY_POSITION_FRAME_OR_EPOCH_MISMATCH" };
  }
  return {
    ok: true,
    value: {
      id: input.id, kind: input.kind as CelestialEntityKind, name: input.name,
      aliases: [...input.aliases], evidenceState: input.evidenceState as EvidenceState,
      sourceRefs: sources.value, cognitiveState: cognitive.value,
      ...(position ? { position } : {}),
      ...(astrometry ? { astrometry } : {}),
    },
  };
}

export function validateCelestialRelation(input: unknown): ValidationResult<CelestialRelation> {
  if (!isRecord(input) || !hasOnlyKeys(
    input, ["id", "fromEntityId", "predicate", "toEntityId", "evidenceState", "sourceRefs"],
  )) {
    return { ok: false, reason: "CELESTIAL_RELATION_SHAPE_INVALID" };
  }
  if (!isId(input.id) || !isId(input.fromEntityId) ||
      !isNonEmptyText(input.predicate, 128) || !isId(input.toEntityId) ||
      typeof input.evidenceState !== "string" || !EVIDENCE_STATE_SET.has(input.evidenceState)) {
    return { ok: false, reason: "CELESTIAL_RELATION_VALUE_INVALID" };
  }
  const sources = validateSourceReferences(input.sourceRefs);
  if (!sources.ok) return sources;
  return {
    ok: true,
    value: {
      id: input.id, fromEntityId: input.fromEntityId, predicate: input.predicate,
      toEntityId: input.toEntityId, evidenceState: input.evidenceState as EvidenceState,
      sourceRefs: sources.value,
    },
  };
}

export function validateCosmicGraphSnapshot(input: unknown): ValidationResult<CosmicGraphSnapshot> {
  if (!isRecord(input) || !hasOnlyKeys(input, [
    "schemaVersion", "datasetId", "datasetRevision", "generatedAt", "entities", "relations",
  ])) {
    return { ok: false, reason: "COSMIC_GRAPH_SHAPE_INVALID" };
  }
  if (input.schemaVersion !== CSE_SCHEMA_VERSION || !isId(input.datasetId) ||
      !isNonEmptyText(input.datasetRevision, 128) || !isIsoUtc(input.generatedAt) ||
      !Array.isArray(input.entities) || input.entities.length > MAX_ENTITIES ||
      !Array.isArray(input.relations) || input.relations.length > MAX_RELATIONS) {
    return { ok: false, reason: "COSMIC_GRAPH_VALUE_INVALID" };
  }

  const entities: CelestialEntity[] = [];
  const entityIds = new Set<string>();
  for (const candidate of input.entities) {
    const checked = validateCelestialEntity(candidate);
    if (!checked.ok) return checked;
    if (entityIds.has(checked.value.id)) {
      return { ok: false, reason: "CELESTIAL_ENTITY_DUPLICATE_ID" };
    }
    entityIds.add(checked.value.id);
    entities.push(checked.value);
  }

  const relations: CelestialRelation[] = [];
  const relationIds = new Set<string>();
  for (const candidate of input.relations) {
    const checked = validateCelestialRelation(candidate);
    if (!checked.ok) return checked;
    if (relationIds.has(checked.value.id)) {
      return { ok: false, reason: "CELESTIAL_RELATION_DUPLICATE_ID" };
    }
    if (!entityIds.has(checked.value.fromEntityId) || !entityIds.has(checked.value.toEntityId)) {
      return { ok: false, reason: "CELESTIAL_RELATION_ENDPOINT_MISSING" };
    }
    relationIds.add(checked.value.id);
    relations.push(checked.value);
  }

  return {
    ok: true,
    value: {
      schemaVersion: CSE_SCHEMA_VERSION, datasetId: input.datasetId,
      datasetRevision: input.datasetRevision, generatedAt: input.generatedAt,
      entities, relations,
    },
  };
}
