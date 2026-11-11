export const GAIA_DR3_TAP_ENDPOINT = "https://gea.esac.esa.int/tap-server/tap";
export const GAIA_DR3_ARCHIVE_URI = "https://gea.esac.esa.int/archive/";
export const GAIA_DR3_SAMPLE_LIMIT = 64;

/** Fixed, bounded ADQL. No client input is interpolated into this query. */
export const GAIA_DR3_SAMPLE_QUERY =
  "SELECT TOP 64 source_id, designation, ref_epoch, ra, dec, ra_error, dec_error, parallax, parallax_error, pmra, pmdec FROM gaiadr3.gaia_source WHERE random_index < 100000 AND astrometric_params_solved = 31 AND ra IS NOT NULL AND dec IS NOT NULL ORDER BY random_index";

export const GAIA_DR3_QUERY_SELECTION =
  "Gaia DR3 five-parameter astrometric solutions from the deterministic random_index < 100000 subset; capped at 64 rows.";
