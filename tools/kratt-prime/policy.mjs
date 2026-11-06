/** Inactive scaffold: no execution, credentials, I/O, approval or activation path. */
export function decide() {
  return Object.freeze({ allowed: false, reason: 'KRATT_PRIME_INACTIVE_UNIMPLEMENTED' })
}
