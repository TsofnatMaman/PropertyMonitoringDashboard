export type CaseKeyInput = {
  caseNumber: string | null | undefined;
  caseTypeId?: string | null;
  caseType?: string | null;
};

export function normalizeCaseTypeKey(
  caseTypeId?: string | null,
  caseType?: string | null
): string {
  const normalizedTypeId = String(caseTypeId || "").trim();
  const normalizedType = String(caseType || "").trim().toLowerCase();

  return normalizedTypeId || normalizedType || "unknown";
}

export function buildCaseKey(input: CaseKeyInput): string {
  const normalizedNumber = String(input.caseNumber || "").trim();
  const caseTypeKey = normalizeCaseTypeKey(input.caseTypeId, input.caseType);

  return `${normalizedNumber}::${caseTypeKey}`;
}
