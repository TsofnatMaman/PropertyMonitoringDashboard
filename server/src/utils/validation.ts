export function isValidApn(value: unknown): boolean {
  return /^\d{6,}$/.test(String(value ?? "").trim());
}