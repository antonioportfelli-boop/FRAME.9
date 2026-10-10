

export function capLabel(state: string): string {
  if (state === "READY") return "Vastab";
  if (state === "USER_CONSENT_REQUIRED" || state === "PERMISSION_REQUIRED") return "Ootab luba";
  if (state === "NOT_CONNECTED") return "Pole ühendatud";
  if (state === "ERROR") return "Viga";
  if (state === "DISABLED") return "Väljas";
  return "Siin ei ole";
}
