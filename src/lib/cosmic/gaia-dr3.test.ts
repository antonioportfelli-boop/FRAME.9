import assert from "node:assert/strict";
import test from "node:test";
import { mapGaiaDr3Source, type GaiaDr3CsvRow } from "./gaia-dr3.ts";

const row = (): GaiaDr3CsvRow => ({
  source_id: "5853498713190525696",
  designation: "Gaia DR3 5853498713190525696",
  ref_epoch: "2016.0",
  ra: "120.125",
  dec: "-34.5",
  ra_error: "0.2",
  dec_error: "0.3",
  parallax: "-0.15",
  parallax_error: "0.1",
  pmra: "-12.4",
  pmdec: "7.8",
});

const options = () => ({
  retrievedAt: "2026-11-11T00:00:00Z",
  cognitiveState: { axisA: 0 as const, axisB: 1 as const, axisC: 2 as const },
});

test("maps Gaia CSV source IDs as text and preserves astrometric semantics", () => {
  const result = mapGaiaDr3Source(row(), options());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.id, "gaia-dr3:5853498713190525696");
  assert.equal(result.value.kind, "ASTROMETRIC_SOURCE");
  assert.equal(result.value.position?.frame, "ICRS");
  assert.equal(result.value.position?.longitudeDeg, 120.125);
  assert.equal(result.value.position?.latitudeDeg, -34.5);
  assert.equal(result.value.position?.epoch, "2016.0 TCB");
  assert.equal(result.value.astrometry?.parallaxMas, -0.15);
  assert.equal(result.value.astrometry?.pmRaMasPerYear, -12.4);
  assert.equal(result.value.evidenceState, "OBSERVED");
  assert.equal(result.value.sourceRefs[0]?.provider, "ESA/Gaia/DPAC");
});

test("rejects numeric source_id to prevent 64-bit precision loss", () => {
  assert.equal(mapGaiaDr3Source({ ...row(), source_id: 5853498713190525696 }, options()).ok, false);
});

test("rejects invalid sky coordinates and negative uncertainty values", () => {
  assert.equal(mapGaiaDr3Source({ ...row(), ra: "360" }, options()).ok, false);
  assert.equal(mapGaiaDr3Source({ ...row(), dec: "-91" }, options()).ok, false);
  assert.equal(mapGaiaDr3Source({ ...row(), parallax_error: "-0.1" }, options()).ok, false);
});

test("preserves negative measured parallax instead of inventing a distance", () => {
  const result = mapGaiaDr3Source(row(), options());
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.astrometry?.parallaxMas, -0.15);
});

test("requires a cognitive state and records retrieval timestamp", () => {
  assert.equal(mapGaiaDr3Source(row(), {
    retrievedAt: "invalid",
    cognitiveState: { axisA: 0, axisB: 0, axisC: 0 },
  }).ok, false);
});
