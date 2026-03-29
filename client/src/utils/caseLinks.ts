type BuildCaseUrlParams = {
  apn?: string | null;
  caseNumber?: string | null;
  caseTypeId?: string | null;
};

function isLikelyCaseTypeId(value: string) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "unknown") return false;
  return /^\d+$/.test(normalized);
}

export function buildCaseUrl({
  apn,
  caseNumber,
  caseTypeId,
}: BuildCaseUrlParams): string | null {
  const normalizedApn = String(apn || "").trim();
  const normalizedCaseNumber = String(caseNumber || "").trim();
  const normalizedCaseTypeId = String(caseTypeId || "").trim();

  if (
    !normalizedApn ||
    !normalizedCaseNumber ||
    !isLikelyCaseTypeId(normalizedCaseTypeId)
  ) {
    return null;
  }

  const url = new URL(
    "https://housingapp.lacity.org/reportviolation/Pages/PublicPropertyActivityReport"
  );

  url.searchParams.set("APN", normalizedApn);
  url.searchParams.set("CaseNo", normalizedCaseNumber);
  url.searchParams.set("CaseType", normalizedCaseTypeId);

  return url.toString();
}
