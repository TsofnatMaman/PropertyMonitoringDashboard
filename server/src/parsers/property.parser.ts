import * as cheerio from "cheerio";
import { PropertyInfo } from "../types/property.types";
import {
  cleanText,
  normalizeLabel,
  parseNullableInt,
  safeFirstNonEmpty,
} from "./utils.parser";

function getTextByIds($: cheerio.CheerioAPI, ids: string[]): string | undefined {
  for (const id of ids) {
    const value = cleanText($(id).first().text());
    if (value) return value;
  }
  return undefined;
}

function buildLabelMap($: cheerio.CheerioAPI): Record<string, string> {
  const map: Record<string, string> = {};

  $("tr").each((_, tr) => {
    const cells = $(tr).find("td, th");
    if (cells.length < 2) return;

    const first = cleanText($(cells[0]).text());
    const second = cleanText($(cells[1]).text());

    if (!first || !second) return;

    const key = normalizeLabel(first);
    if (!key) return;

    map[key] = second;
  });

  return map;
}

function pickLabel(map: Record<string, string>, names: string[]) {
  for (const name of names) {
    const value = map[normalizeLabel(name)];
    if (cleanText(value)) return cleanText(value);
  }
}

export function extractProperty($: cheerio.CheerioAPI): PropertyInfo {
  const labelMap = buildLabelMap($);

  return {
    apn: safeFirstNonEmpty(
      getTextByIds($, ["#lblAPN2", "#lblAPN"]),
      pickLabel(labelMap, ["Assessor Parcel Number"])
    ),
    officialAddress: safeFirstNonEmpty(
      getTextByIds($, ["#lblAddress"]),
      pickLabel(labelMap, ["Official Address"])
    ),
    councilDistrict: safeFirstNonEmpty(
      getTextByIds($, ["#lblCD"]),
      pickLabel(labelMap, ["Council District"])
    ),
    censusTract: safeFirstNonEmpty(
      getTextByIds($, ["#lblCT"]),
      pickLabel(labelMap, ["Census Tract"])
    ),
    rentRegistrationNumber: safeFirstNonEmpty(
      getTextByIds($, ["#lblRegNo"]),
      pickLabel(labelMap, ["Rent Registration Number"])
    ),
    historicalPreservationOverlayZone: safeFirstNonEmpty(
      getTextByIds($, ["#lblHPOZ"]),
      pickLabel(labelMap, ["Historical Preservation Overlay Zone"])
    ),
    totalUnits: parseNullableInt(
      safeFirstNonEmpty(
        getTextByIds($, ["#lblTotalPropUnits"]),
        pickLabel(labelMap, ["Total Units"])
      )
    ),
    regionalOffice: safeFirstNonEmpty(
      getTextByIds($, ["#lblRO"]),
      pickLabel(labelMap, ["Regional Office"])
    ),
    regionalOfficeContact: safeFirstNonEmpty(
      getTextByIds($, ["#lblROPhone"]),
      pickLabel(labelMap, ["Regional Office Contact"])
    ),
    totalExemptionUnits: parseNullableInt(
      safeFirstNonEmpty(
        getTextByIds($, ["#lblSCEPExemptions"]),
        pickLabel(labelMap, ["Total Exemption Units"])
      )
    ),
  };
}