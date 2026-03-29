import * as cheerio from "cheerio";

export function getHtmlLength(data: unknown): number {
  return typeof data === "string" ? data.length : 0;
}

export function normalizeWhitespace(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getBodyTextSample($: cheerio.CheerioAPI, maxLength = 500): string {
  return normalizeWhitespace($("body").text()).slice(0, maxLength);
}

export function getHtmlPreview(data: unknown, maxLength = 2000): string | null {
  if (typeof data !== "string") return null;
  return data.slice(0, maxLength);
}

export function getFinalResponseUrl(response: any): string | null {
  return (
    response?.request?.res?.responseUrl ||
    response?.request?.responseURL ||
    response?.config?.url ||
    null
  );
}

export function summarizeTables(
  $: cheerio.CheerioAPI,
  maxTables = 10,
  maxTextLength = 220
) {
  return $("table")
    .slice(0, maxTables)
    .map((index, el) => {
      const textSample = normalizeWhitespace($(el).text()).slice(0, maxTextLength);
      const rowCount = $(el).find("tr").length;
      const cellCount = $(el).find("td, th").length;

      return {
        index,
        rowCount,
        cellCount,
        textSample,
      };
    })
    .get();
}

export function summarizeLinks(
  $: cheerio.CheerioAPI,
  maxLinks = 15,
  maxTextLength = 120
) {
  return $("a")
    .slice(0, maxLinks)
    .map((index, el) => {
      const text = normalizeWhitespace($(el).text()).slice(0, maxTextLength);
      const href = $(el).attr("href") ?? null;

      return {
        index,
        text,
        href,
      };
    })
    .get();
}

export function countCaseLikeTables($: cheerio.CheerioAPI): number {
  return $("table")
    .filter((_, el) => {
      const text = normalizeWhitespace($(el).text()).toLowerCase();
      return (
        text.includes("case") ||
        text.includes("case no") ||
        text.includes("case number") ||
        text.includes("status") ||
        text.includes("activity")
      );
    })
    .length;
}

export function countCaseLikeLinks($: cheerio.CheerioAPI): number {
  return $("a")
    .filter((_, el) => {
      const href = String($(el).attr("href") ?? "").toLowerCase();
      const text = normalizeWhitespace($(el).text()).toLowerCase();

      return (
        href.includes("caseno=") ||
        href.includes("casetype=") ||
        text.includes("case")
      );
    })
    .length;
}

export function isErrorPage(
  $: cheerio.CheerioAPI,
  finalUrl: string | null,
  bodyTextSample: string
): boolean {
  const normalizedUrl = String(finalUrl ?? "").toLowerCase();
  const normalizedBody = bodyTextSample.toLowerCase();
  const pageTitle = normalizeWhitespace($("title").text()).toLowerCase();

  return (
    normalizedUrl.includes("/pages/errorpage") ||
    pageTitle.includes("error") ||
    normalizedBody.includes("the server encountered an error processing the request") ||
    normalizedBody.includes("system.web.httpunhandledexception") ||
    normalizedBody.includes("we are sorry for your inconvenience")
  );
}

export function isExpectedPropertyPage(
  finalUrl: string | null,
  tableCount: number,
  caseLikeTableCount: number,
  caseLikeLinkCount: number
): boolean {
  const normalizedUrl = String(finalUrl ?? "").toLowerCase();

  if (normalizedUrl.includes("/pages/errorpage")) {
    return false;
  }

  return tableCount > 0 || caseLikeTableCount > 0 || caseLikeLinkCount > 0;
}

export function isExpectedCasePage(
  finalUrl: string | null,
  tableCount: number,
  bodyTextSample: string
): boolean {
  const normalizedUrl = String(finalUrl ?? "").toLowerCase();
  const normalizedBody = bodyTextSample.toLowerCase();

  if (normalizedUrl.includes("/pages/errorpage")) {
    return false;
  }

  return (
    tableCount > 0 ||
    normalizedBody.includes("activity") ||
    normalizedBody.includes("case") ||
    normalizedBody.includes("status")
  );
}
