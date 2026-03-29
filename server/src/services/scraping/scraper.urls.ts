const BASE_URL =
  "https://housingapp.lacity.org/reportviolation/Pages/PropAtivityCases";

export function buildPropertyUrl(apn: string) {
  const url = new URL(BASE_URL);
  url.searchParams.set("APN", apn);
  url.searchParams.set("Source", "ActivityReport");
  return `${url.toString()}#divPropDetails`;
}

export function buildCaseUrl(apn: string, caseNumber: string, caseTypeId: string) {
  const url = new URL(BASE_URL);
  url.searchParams.set("APN", apn);
  url.searchParams.set("Source", "ActivityReport");
  url.searchParams.set("CaseNo", caseNumber);
  url.searchParams.set("CaseType", caseTypeId);
  return url.toString();
}
