import { beforeEach, describe, expect, it, vi } from "vitest";
import { scrapeCaseActivities, scrapePropertyByApn } from "./scraper.service";
import { getWithRetry } from "./scraper.http";
import { extractProperty } from "../../parsers/property.parser";
import { extractCases } from "../../parsers/cases.parser";
import { extractCaseActivities } from "../../parsers/activities.parser";

vi.mock("./scraper.http", () => ({
  getWithRetry: vi.fn(),
}));

vi.mock("../../parsers/property.parser", () => ({
  extractProperty: vi.fn(),
}));

vi.mock("../../parsers/cases.parser", () => ({
  extractCases: vi.fn(),
}));

vi.mock("../../parsers/activities.parser", () => ({
  extractCaseActivities: vi.fn(),
}));

const mockedGetWithRetry = vi.mocked(getWithRetry);
const mockedExtractProperty = vi.mocked(extractProperty);
const mockedExtractCases = vi.mocked(extractCases);
const mockedExtractCaseActivities = vi.mocked(extractCaseActivities);

describe("scraper.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scrapes property page and returns parsed property + cases", async () => {
    const propertyHtml = `
      <html>
        <head><title>Property Activity</title></head>
        <body>
          <table><tr><td>Case Number</td></tr></table>
        </body>
      </html>
    `;

    mockedGetWithRetry.mockResolvedValue({
      data: propertyHtml,
      config: { url: "https://housingapp.lacity.org/reportviolation/Pages/PropAtivityCases?APN=2654002037" },
      request: { responseURL: "https://housingapp.lacity.org/reportviolation/Pages/PropAtivityCases?APN=2654002037" },
      status: 200,
      headers: {},
    } as any);

    mockedExtractProperty.mockReturnValue({
      apn: "2654002037",
      description: "Sample Property",
    } as any);

    mockedExtractCases.mockReturnValue([
      {
        caseNumber: "CASE-1",
        caseType: "General",
        caseTypeId: "general",
      },
    ] as any);

    const result = await scrapePropertyByApn("2654002037");

    expect(mockedGetWithRetry).toHaveBeenCalledTimes(1);
    expect(mockedGetWithRetry.mock.calls[0][0]).toContain("APN=2654002037");
    expect(result.property.apn).toBe("2654002037");
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0].caseNumber).toBe("CASE-1");
  });

  it("throws when property page is invalid", async () => {
    mockedGetWithRetry.mockResolvedValue({
      data: "<html><body><div>hello world</div></body></html>",
      config: { url: "https://housingapp.lacity.org/reportviolation/Pages/PropAtivityCases?APN=111" },
      request: { responseURL: "https://housingapp.lacity.org/reportviolation/Pages/PropAtivityCases?APN=111" },
      status: 200,
      headers: {},
    } as any);

    await expect(scrapePropertyByApn("111")).rejects.toThrow(
      "Invalid property page received for APN 111"
    );
  });

  it("scrapes case activities and returns parsed activities", async () => {
    const caseHtml = `
      <html>
        <head><title>Case Details</title></head>
        <body>
          <table><tr><td>Activity</td></tr></table>
        </body>
      </html>
    `;

    mockedGetWithRetry.mockResolvedValue({
      data: caseHtml,
      config: { url: "https://housingapp.lacity.org/reportviolation/Pages/PropAtivityCases?APN=2654002037&CaseNo=25-001&CaseType=ceeb" },
      request: { responseURL: "https://housingapp.lacity.org/reportviolation/Pages/PropAtivityCases?APN=2654002037&CaseNo=25-001&CaseType=ceeb" },
      status: 200,
      headers: {},
    } as any);

    mockedExtractCaseActivities.mockReturnValue([
      {
        activityDate: "2026-03-01",
        status: "Violation notice",
      },
    ] as any);

    const result = await scrapeCaseActivities({
      apn: "2654002037",
      caseNumber: "25-001",
      caseType: "ceeb",
    });

    expect(mockedGetWithRetry).toHaveBeenCalledTimes(1);
    expect(mockedGetWithRetry.mock.calls[0][0]).toContain("CaseNo=25-001");
    expect(mockedGetWithRetry.mock.calls[0][0]).toContain("CaseType=ceeb");
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].status).toBe("Violation notice");
  });
});
