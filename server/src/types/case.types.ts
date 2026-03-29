export type CaseRecord = {
  id: number;
  property_id: number;
  case_number: string;
  case_type?: string | null;
  case_type_id: string;
  latest_status?: string | null;
  latest_activity_date?: string | null;
};

export type CaseWithProperty = CaseRecord & {
  apn?: string | null;
  description?: string | null;
};