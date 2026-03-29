import * as cheerio from "cheerio";
import { extractCases } from "../../parsers/cases.parser";
import { extractProperty } from "../../parsers/property.parser";
import { extractCaseActivities } from "../../parsers/activities.parser";
import type { PropertyCase, PropertyInfo } from "../../types/property.types";
import { logger } from "../system/logger.service";
import { getWithRetry } from "./scraper.http";
import { buildCaseUrl, buildPropertyUrl } from "./scraper.urls";
import {
  countCaseLikeLinks,
  countCaseLikeTables,
  getBodyTextSample,
  getFinalResponseUrl,
  getHtmlLength,
  getHtmlPreview,
  isErrorPage,
  isExpectedCasePage,
  isExpectedPropertyPage,
  normalizeWhitespace,
  summarizeLinks,
  summarizeTables,
} from "./scraper.utils";

type ScrapedPropertyResult = {
  property: PropertyInfo;
  cases: PropertyCase[];
};

type ScrapeCaseActivitiesInput = {
  apn: string;
  caseNumber: string;
  caseType: string | null;
};

type ScrapeCaseActivitiesResult = {
  activities: Array<{
    activityDate?: string | null;
    status?: string | null;
  }>;
};

export async function scrapePropertyByApn(
  apn: string
): Promise<ScrapedPropertyResult> {
  logger.info("Starting property scrape", { apn });
  const startTime = Date.now();

  try {
    const url = buildPropertyUrl(apn);
    logger.debug("Built property URL", { url });

    const response = await getWithRetry(url);
    const fetchDuration = Date.now() - startTime;
    const htmlLength = getHtmlLength(response.data);

    logger.debug("Fetched property page", {
      apn,
      duration: `${fetchDuration}ms`,
      htmlLength,
    });

    const parseStartTime = Date.now();
    const $ = cheerio.load(response.data);

    const finalUrl = getFinalResponseUrl(response);
    const pageTitle = normalizeWhitespace($("title").text());
    const bodyTextSample = getBodyTextSample($, 700);
    const tableCount = $("table").length;
    const formCount = $("form").length;
    const iframeCount = $("iframe").length;
    const scriptCount = $("script").length;
    const linkCount = $("a").length;
    const caseLikeTableCount = countCaseLikeTables($);
    const caseLikeLinkCount = countCaseLikeLinks($);

    logger.debug("Property page diagnostics", {
      apn,
      requestedUrl: url,
      finalUrl,
      htmlLength,
      pageTitle,
      tableCount,
      formCount,
      iframeCount,
      scriptCount,
      linkCount,
      caseLikeTableCount,
      caseLikeLinkCount,
      bodyTextSample,
      topTables: summarizeTables($, 10, 220),
      topLinks: summarizeLinks($, 15, 120),
    });

    const pageLooksLikeError = isErrorPage($, finalUrl, bodyTextSample);
    const pageLooksValid = isExpectedPropertyPage(
      finalUrl,
      tableCount,
      caseLikeTableCount,
      caseLikeLinkCount
    );

    if (pageLooksLikeError || !pageLooksValid) {
      logger.error("Property scrape received invalid/error page", {
        apn,
        requestedUrl: url,
        finalUrl,
        htmlLength,
        pageTitle,
        tableCount,
        formCount,
        iframeCount,
        scriptCount,
        linkCount,
        caseLikeTableCount,
        caseLikeLinkCount,
        bodyTextSample,
        topTables: summarizeTables($, 15, 300),
        topLinks: summarizeLinks($, 20, 160),
        htmlPreview: getHtmlPreview(response.data, 2500),
      });

      throw new Error(
        `Invalid property page received for APN ${apn}. Final URL: ${finalUrl ?? "unknown"}`
      );
    }

    const property = extractProperty($);

    const hasRealPropertyData = Boolean(
      property &&
        (
          property.apn ||
          (property as { description?: string | null }).description
        )
    );

    logger.debug("Property extraction result", {
      apn,
      propertyExtracted: hasRealPropertyData,
      propertySummary: property
        ? {
            apn: property.apn ?? null,
            description:
              (property as { description?: string | null }).description ?? null,
          }
        : null,
    });

    const cases = extractCases($);

    logger.debug("Cases extraction result", {
      apn,
      casesFound: cases.length,
      casesPreview: cases.slice(0, 10).map((item, index) => ({
        index,
        caseNumber: item.caseNumber ?? null,
        caseType: item.caseType ?? null,
        caseTypeId: item.caseTypeId ?? null,
        latestStatus: item.latestStatus ?? null,
        latestActivityDate: item.latestActivityDate ?? null,
      })),
    });

    if (cases.length === 0) {
      logger.warn("No CASES found on property page", {
        apn,
        requestedUrl: url,
        finalUrl,
        htmlLength,
        pageTitle,
        propertyExtracted: hasRealPropertyData,
        tableCount,
        formCount,
        iframeCount,
        scriptCount,
        linkCount,
        caseLikeTableCount,
        caseLikeLinkCount,
        bodyTextSample,
        topTables: summarizeTables($, 15, 300),
        topLinks: summarizeLinks($, 20, 160),
        htmlPreview: getHtmlPreview(response.data, 2500),
      });
    }

    const parseDuration = Date.now() - parseStartTime;

    logger.info("Property scrape completed", {
      apn,
      totalDuration: `${Date.now() - startTime}ms`,
      fetchDuration: `${fetchDuration}ms`,
      parseDuration: `${parseDuration}ms`,
      casesFound: cases.length,
      propertyExtracted: hasRealPropertyData,
      pageTitle,
      finalUrl,
    });

    return {
      property,
      cases,
    };
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;

    logger.error("Property scrape failed", {
      apn,
      totalDuration: `${totalDuration}ms`,
      error: error?.message,
      code: error?.code,
      status: error?.response?.status,
    });

    throw error;
  }
}

export async function scrapeCaseActivities(
  input: ScrapeCaseActivitiesInput
): Promise<ScrapeCaseActivitiesResult> {
  const apn = String(input.apn || "").trim();
  const caseNumber = String(input.caseNumber || "").trim();
  const caseTypeId = String(input.caseType || "").trim();

  logger.debug("Starting case activity scrape", {
    apn,
    caseNumber,
    caseTypeId,
  });

  const startTime = Date.now();

  try {
    if (!apn) {
      throw new Error("Missing APN for case activity scraping");
    }

    if (!caseNumber) {
      throw new Error("Missing case number for case activity scraping");
    }

    if (!caseTypeId) {
      throw new Error(`Missing caseTypeId for case ${caseNumber}`);
    }

    const url = buildCaseUrl(apn, caseNumber, caseTypeId);
    logger.debug("Built case URL", { url });

    const response = await getWithRetry(url);
    const fetchDuration = Date.now() - startTime;
    const htmlLength = getHtmlLength(response.data);

    logger.debug("Fetched case page", {
      caseNumber,
      duration: `${fetchDuration}ms`,
      htmlLength,
    });

    const parseStartTime = Date.now();
    const $ = cheerio.load(response.data);

    const finalUrl = getFinalResponseUrl(response);
    const pageTitle = normalizeWhitespace($("title").text());
    const bodyTextSample = getBodyTextSample($, 700);
    const tableCount = $("table").length;

    logger.debug("Case activity page diagnostics", {
      apn,
      caseNumber,
      caseTypeId,
      requestedUrl: url,
      finalUrl,
      htmlLength,
      pageTitle,
      tableCount,
      bodyTextSample,
      topTables: summarizeTables($, 10, 220),
    });

    const pageLooksLikeError = isErrorPage($, finalUrl, bodyTextSample);
    const pageLooksValid = isExpectedCasePage(
      finalUrl,
      tableCount,
      bodyTextSample
    );

    if (pageLooksLikeError || !pageLooksValid) {
      logger.error("Case activity scrape received invalid/error page", {
        apn,
        caseNumber,
        caseTypeId,
        requestedUrl: url,
        finalUrl,
        htmlLength,
        pageTitle,
        tableCount,
        bodyTextSample,
        topTables: summarizeTables($, 15, 300),
        htmlPreview: getHtmlPreview(response.data, 2500),
      });

      throw new Error(
        `Invalid case activity page received for case ${caseNumber}. Final URL: ${finalUrl ?? "unknown"}`
      );
    }

    const activities = extractCaseActivities($, caseNumber);
    const parseDuration = Date.now() - parseStartTime;

    logger.debug("Case activities extraction result", {
      apn,
      caseNumber,
      caseTypeId,
      activitiesFound: activities.length,
      activitiesPreview: activities.slice(0, 10).map((item, index) => ({
        index,
        activityDate: item.activityDate ?? null,
        status: item.status ?? null,
      })),
    });

    if (activities.length === 0) {
      logger.warn("No activities found on case page", {
        apn,
        caseNumber,
        caseTypeId,
        requestedUrl: url,
        finalUrl,
        htmlLength,
        pageTitle,
        tableCount,
        bodyTextSample,
        topTables: summarizeTables($, 15, 300),
        htmlPreview: getHtmlPreview(response.data, 2500),
      });
    }

    logger.info("Case activity scrape completed", {
      caseNumber,
      totalDuration: `${Date.now() - startTime}ms`,
      fetchDuration: `${fetchDuration}ms`,
      parseDuration: `${parseDuration}ms`,
      activitiesFound: activities.length,
      pageTitle,
      finalUrl,
    });

    return {
      activities,
    };
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;

    logger.error("Case activity scrape failed", {
      caseNumber,
      totalDuration: `${totalDuration}ms`,
      error: error?.message,
      code: error?.code,
      status: error?.response?.status,
    });

    throw error;
  }
}
