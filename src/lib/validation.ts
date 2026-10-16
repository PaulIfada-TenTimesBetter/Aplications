export const VIEW_MODES = ["day", "week", "month"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export function isValidViewMode(value: unknown): value is ViewMode {
  return typeof value === "string" && (VIEW_MODES as readonly string[]).includes(value);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime());
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
