export type CaseFlags = {
  isOpen: boolean;
  needsAttention: boolean;
  isUrgent: boolean;
  hasNewActivity: boolean;
};

export type Case = {
  id: number;
  property_id: number;
  apn?: string;
  description?: string;
  case_number: string;
  case_type?: string | null;
  case_type_id?: string | null;
  latest_status?: string | null;
  latest_activity_date?: string | null;
  flags: CaseFlags;
};

export type CasesSummary = {
  total: number;
  open: number;
  attention: number;
  urgent: number;
};

export type CaseFilters = {
  query?: string;
  openOnly?: boolean;
  attentionOnly?: boolean;
  urgentOnly?: boolean;
  newActivityOnly?: boolean,
};

export type CasePaginationParams = {
  limit: number;
  offset: number;
};

export type CasePaginationInfo = {
  limit: number;
  offset: number;
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type CasesOverviewResponse = {
  ok: true;
  cases: Case[];
  summary: CasesSummary;
  pagination: CasePaginationInfo;
  filters: CaseFilters;
};