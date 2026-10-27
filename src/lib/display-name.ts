/** Hides development-only markers from text shown in the interface. */
export function displayName(value: string): string {
  return value
    .replace(/\[DEV\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Removes the generic description added to seeded demo products. */
export function displayDescription(value: string): string {
  return displayName(value).replace(/^produto de desenvolvimento:\s*/i, "");
}
