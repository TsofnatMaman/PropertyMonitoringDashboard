import { useCallback, useEffect, useState } from "react";
import { getCasesOverview } from "../services/monitoring.api";
import type { CaseFilters, CasesSummary, CasePaginationInfo, Case } from "../types/case";
import { DEFAULT_CASES_PAGE_SIZE } from "../constants/pagination";

const emptySummary: CasesSummary = {
  total: 0,
  open: 0,
  attention: 0,
  urgent: 0,
};

const emptyPagination: CasePaginationInfo = {
  limit: DEFAULT_CASES_PAGE_SIZE,
  offset: 0,
  total: 0,
  page: 1,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

export function useCasesOverview(filters: CaseFilters) {
  const [cases, setCases] = useState<Case[]>([]);
  const [summary, setSummary] = useState<CasesSummary>(emptySummary);
  const [pagination, setPagination] = useState<CasePaginationInfo>(emptyPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadCases = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        setError("");

        const offset = (page - 1) * DEFAULT_CASES_PAGE_SIZE;
        const data = await getCasesOverview(filters, {
          limit: DEFAULT_CASES_PAGE_SIZE,
          offset: offset,
        });
        
        setCases(data.cases || []);
        setSummary(data.summary || emptySummary);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err?.message || "Failed to load cases.");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Load cases when current page changes
  useEffect(() => {
    void loadCases(currentPage);
  }, [currentPage, loadCases]);

  const goToPage = useCallback((page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  }, [pagination.totalPages]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, pagination.hasNextPage, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, pagination.hasPrevPage, goToPage]);

  return {
    cases,
    summary,
    pagination,
    currentPage,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    reload: () => {
      setCurrentPage(1);
    },
  };
}
