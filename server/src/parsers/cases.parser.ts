import * as cheerio from "cheerio";
import { cleanText, normalizeLabel } from "./utils.parser";

type ExtractedCase = {
  caseNumber: string;
  caseType?: string | null;
  caseTypeId?: string | null;
  latestStatus?: string | null;
  latestActivityDate?: string | null;
};

function getCellByHeader(
  headers: string[],
  cells: string[],
  wantedHeaders: string[]
): string | null {
  for (const wanted of wantedHeaders) {
    const index = headers.findIndex((h) => h === normalizeLabel(wanted));
    if (index >= 0) {
      return cells[index] || null;
    }
  }
  return null;
}

function getCaseLinkFromRow(
  $: cheerio.CheerioAPI,
  row: any
): cheerio.Cheerio<any> {
  const links = $(row).find("a").toArray();

  for (const link of links) {
    const href = $(link).attr("href") || "";
    const text = cleanText($(link).text());
    const id = $(link).attr("id") || "";

    if (
      id.includes("lnkSelectCase") ||
      href.includes("dgPropCases2$") ||
      href.includes("WebForm_DoPostBackWithOptions") ||
      href.includes("CaseNo=") ||
      /^\d+$/.test(text) ||
      text.toLowerCase() === "select"
    ) {
      return $(link);
    }
  }

  return $([]);
}

export function extractCases($: cheerio.CheerioAPI): ExtractedCase[] {
  const results: ExtractedCase[] = [];

  $("table").each((_, table) => {
    const headerRow = $(table).find("tr").first();
    const headers = headerRow
      .find("th")
      .map((__, th) => normalizeLabel($(th).text()))
      .get()
      .filter(Boolean);

    if (headers.length === 0) return;

    const looksLikeCasesTable =
      headers.some((h) => h.includes("case")) &&
      (
        headers.some((h) => h.includes("type")) ||
        headers.some((h) => h.includes("number")) ||
        headers.some((h) => h.includes("closed")) ||
        headers.some((h) => h.includes("status"))
      );

    if (!looksLikeCasesTable) return;

    $(table)
      .find("tbody tr, tr")
      .slice(1)
      .each((__, row) => {
        const tds = $(row).find("td");
        if (tds.length === 0) return;

        const cells = tds
          .map((___, td) => cleanText($(td).text()))
          .get();

        const link = getCaseLinkFromRow($, row);
        const href = link.attr("href") || "";

        let caseTypeId: string | null =
          link.attr("data-casetype")?.trim() || null;

        if (!caseTypeId) {
          try {
            const url = new URL(href, "https://housingapp.lacity.org");
            caseTypeId = url.searchParams.get("CaseType");
          } catch {
            const match = href.match(/CaseType=(\d+)/);
            if (match) caseTypeId = match[1];
          }
        }

        const caseNumber =
          getCellByHeader(headers, cells, [
            "Case Number",
            "Case #",
            "Case No",
          ]) ||
          cells.find((c) => /^\d+$/.test(c)) ||
          "";

        if (!caseNumber || !/^\d+$/.test(caseNumber)) return;

        const caseType = getCellByHeader(headers, cells, [
          "Case Type",
          "Type",
        ]);

        results.push({
          caseNumber,
          caseType,
          caseTypeId,
          latestStatus: null,
          latestActivityDate: null,
        });
      });
  });

  return results;
}