export function cleanText(value?: string | null): string {
  return (value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLabel(value?: string | null): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[:]/g, "")
    .trim();
}

export function parseNullableInt(value?: string | null): number | null {
  const v = cleanText(value);
  if (!v) return null;
  const n = Number(v.replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function safeFirstNonEmpty(
  ...values: Array<string | undefined | null>
): string | undefined {
  for (const value of values) {
    const cleaned = cleanText(value);
    if (cleaned) return cleaned;
  }
  return undefined;
}