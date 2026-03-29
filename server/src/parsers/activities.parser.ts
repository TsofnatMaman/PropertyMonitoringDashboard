import * as cheerio from "cheerio";
import { cleanText, normalizeLabel } from "./utils.parser";

export function extractCaseActivities(
  $: cheerio.CheerioAPI,
  caseNumber: string
): Array<{ activityDate?: string | null; status: string }> {
  const result: Array<{ activityDate?: string | null; status: string }> = [];

  const pageCaseNumber =
    cleanText($("#lblCaseNumber").text()) ||
    cleanText($("*:contains('Case Number:')").first().text());

  if (pageCaseNumber && !pageCaseNumber.includes(caseNumber)) {
    return result;
  }

  $("table").each((_, table) => {
    const headers = $(table)
      .find("th")
      .map((__, th) => normalizeLabel($(th).text()))
      .get();

    const isActivityTable =
      headers.includes("date") && headers.includes("status");

    if (!isActivityTable) return;

    $(table)
      .find("tbody tr")
      .each((__, tr) => {
        const cells = $(tr)
          .find("td")
          .map((___, td) => cleanText($(td).text()))
          .get();

        if (cells.length < 2) return;

        result.push({
          activityDate: cells[0] || null,
          status: cells[1] || "",
        });
      });
  });

  return result.filter((x) => x.status);
}