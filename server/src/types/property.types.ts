export type PropertyInfo = {
  apn?: string;
  officialAddress?: string;
  councilDistrict?: string;
  censusTract?: string;
  rentRegistrationNumber?: string;
  historicalPreservationOverlayZone?: string;
  totalUnits?: number | null;
  regionalOffice?: string;
  regionalOfficeContact?: string;
  totalExemptionUnits?: number | null;
};

export type PropertyRecord = {
  id: number;
  apn: string;
  description?: string | null;
  created_at?: string;
};

export type PropertyCase = {
  caseNumber: string;
  caseType?: string | null;
  caseTypeId?: string | null;
  latestStatus?: string | null;
  latestActivityDate?: string | null;
  raw?: string[];
};
