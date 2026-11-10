/**
 * Bounded Gaia DR3 CSV-row mapper.
 *
 * This module does not make network requests, classify source type, infer
 * distances, or treat Gaia source_id as a JavaScript number.
 */
import {
  validateCelestialEntity,
  validateCognitiveState,
  type CelestialEntity,
  type CognitiveState,
  type ValidationResult,
} from "./contracts.ts";

export type GaiaDr3CsvRow = Readonly<{
  source_id: string;
  designation: string | null;
  ref_epoch: string;
  ra: string;
  dec: string;
  ra_error: string | null;
  dec_error: string | null;
  parallax: string | null;
  parallax_error: string | null;
  pmra: string | null;
  pmdec: string | null;
}>;

export type GaiaDr3ImportOptions = Readonly<{
  retrievedAt: string;
  cognitiveState: CognitiveState;
}>;

const GAIA_ARCHIVE_URI = "https://gea.esac.esa.int/archive/";
const GAIA_ATTRIBUTION_TAG = "ESA-GAIA-OPEN-DATA-ATTRIBUTION";
const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, required: readonly string[]): boolean {
  const allowed = new Set(required);
  const keys = Reflect.ownKeys(value);
  return keys.every((key) => typeof key === "string" && allowed.has(key)) &&
    required.every((key) => Object.hasOwn(value, key));
}

function parseRequiredNumber(value: unknown): number | null {
  if (typeof value !== "string" || !DECIMAL_PATTERN.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string" || !DECIMAL_PATTERN.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function validSourceId(value: unknown): value is string {
  // Gaia source_id is a 64-bit catalogue identifier. Keep it as text to avoid
  // precision loss in JavaScript's IEEE-754 Number representation.
  return typeof value === "string" && /^[1-9]\d{0,18}$/.test(value);
}

export function mapGaiaDr3Source(
  input: unknown,
  options: GaiaDr3ImportOptions,
): ValidationResult<CelestialEntity> {
  const fields = [
    "source_id", "designation", "ref_epoch", "ra", "dec", "ra_error", "dec_error",
    "parallax", "parallax_error", "pmra", "pmdec",
  ];
  if (!isRecord(input) || !hasExactKeys(input, fields)) {
    return { ok: false, reason: "GAIA_DR3_ROW_SHAPE_INVALID" };
  }
  if (!validSourceId(input.source_id) ||
      !(input.designation === null ||
        (typeof input.designation === "string" && input.designation.trim().length > 0 &&
          input.designation.length <= 128)) ||
      typeof options?.retrievedAt !== "string") {
    return { ok: false, reason: "GAIA_DR3_ROW_ID_OR_OPTIONS_INVALID" };
  }

  const refEpoch = parseRequiredNumber(input.ref_epoch);
  const ra = parseRequiredNumber(input.ra);
  const dec = parseRequiredNumber(input.dec);
  const raError = parseNullableNumber(input.ra_error);
  const decError = parseNullableNumber(input.dec_error);
  const parallax = parseNullableNumber(input.parallax);
  const parallaxError = parseNullableNumber(input.parallax_error);
  const pmRa = parseNullableNumber(input.pmra);
  const pmDec = parseNullableNumber(input.pmdec);

  if (refEpoch === null || ra === null || dec === null ||
      raError === undefined || decError === undefined ||
      parallax === undefined || parallaxError === undefined ||
      pmRa === undefined || pmDec === undefined ||
      ra < 0 || ra >= 360 || dec < -90 || dec > 90 ||
      refEpoch < 1800 || refEpoch > 2500 ||
      (raError !== null && raError < 0) ||
      (decError !== null && decError < 0) ||
      (parallaxError !== null && parallaxError < 0)) {
    return { ok: false, reason: "GAIA_DR3_ASTROMETRY_INVALID" };
  }

  const cognitive = validateCognitiveState(options.cognitiveState);
  if (!cognitive.ok) return cognitive;

  const sourceId = input.source_id;
  const entity = {
    id: `gaia-dr3:${sourceId}`,
    kind: "ASTROMETRIC_SOURCE",
    name: `Gaia DR3 ${sourceId}`,
    aliases: input.designation ? [input.designation] : [],
    evidenceState: "OBSERVED",
    sourceRefs: [{
      id: `gaia-source:${sourceId}`,
      provider: "ESA/Gaia/DPAC",
      resource: `gaiadr3.gaia_source/${sourceId}`,
      revision: "Gaia DR3",
      uri: GAIA_ARCHIVE_URI,
      retrievedAt: options.retrievedAt,
      licenseId: GAIA_ATTRIBUTION_TAG,
    }],
    cognitiveState: cognitive.value,
    position: {
      frame: "ICRS",
      longitudeDeg: ra,
      latitudeDeg: dec,
      epoch: `${refEpoch.toFixed(1)} TCB`,
    },
    astrometry: {
      referenceEpochJulianYear: refEpoch,
      timeScale: "TCB",
      raErrorMas: raError,
      decErrorMas: decError,
      parallaxMas: parallax,
      parallaxErrorMas: parallaxError,
      pmRaMasPerYear: pmRa,
      pmDecMasPerYear: pmDec,
    },
  };

  return validateCelestialEntity(entity);
}
