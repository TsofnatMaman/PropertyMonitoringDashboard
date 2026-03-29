// Case classification markers and rules for determining case status
// These constants define what makes a case "closed", "urgent", "needs attention", etc.

export const CASE_STATUS = {
  CLOSED: [
    "closed",
    "close",
    "resolved",
    "all violations resolved",
    "all violations resolved date",
    "complied",
    "compliance achieved",
    "withdrawn",
    "canceled",
    "cancelled",
    "abated",
    "satisfied",
  ],
  NEEDS_ATTENTION: [
    "violation",
    "non-compliance",
    "follow up",
    "re-inspection",
    "reinspection",
    "failed inspection",
    "order",
    "notice",
    "citation",
    "site visit/compliance inspection",
    "site visit",
    "compliance inspection",
    "senior inspector appeal received",
    "appeal received",
    "referred to enforcement section",
  ],
  URGENT: [
    "order to comply",
    "final notice",
    "imminent hazard",
    "vacate",
    "emergency order",
    "emergency declaration",
    "referred to enforcement section",
  ],
} as const;

export const CASE_TYPE = {
  NEEDS_ATTENTION: [
    "substandard",
    "specialized enforcement unit",
    "specialized",
    "case management",
    "property management training program",
    "systematic code enforcement program",
    "hearing",
    "emergency",
  ],
  URGENT: [
    "emergency",
  ],
} as const;

export const NEW_ACTIVITY_WINDOW_DAYS = 100;

/**
 * Check if a string contains any of the needle values (case-insensitive).
 * Used to match status strings against marker lists.
 */
export function hasMarker(
  value: string,
  markers: readonly string[]
): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  return markers.some((marker) => normalized.includes(marker));
}
