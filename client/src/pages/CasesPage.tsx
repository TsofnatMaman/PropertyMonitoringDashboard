import { useMemo, useState } from "react";
import Button from "../components/ui/Button";
import PaginationControls from "../components/ui/Pagination";
import CasesFilters from "../components/cases/CasesFilters";
import CasesSummaryCards from "../components/cases/CasesSummaryCards";
import CasesTable from "../components/cases/CasesTable";
import SyncProgressCard from "../components/cases/SyncProgressCard";
import { useCasesOverview } from "../hooks/useCasesOverview";
import { useSyncAllProperties } from "../hooks/useSyncAllProperties";
import type { CaseFilters as Filters, CaseSort } from "../types/case";

export default function CasesPage() {
  const [filters, setFilters] = useState<Filters>({
    query: "",
    openOnly: false,
    attentionOnly: false,
    urgentOnly: false,
    newActivityOnly: false,
  });
  const [sort, setSort] = useState<CaseSort>({});

  const stableFilters = useMemo(
    () => ({
      query: filters.query || "",
      openOnly: Boolean(filters.openOnly),
      attentionOnly: Boolean(filters.attentionOnly),
      urgentOnly: Boolean(filters.urgentOnly),
      newActivityOnly: Boolean(filters.newActivityOnly),
    }),
    [filters]
  );

  const stableSort = useMemo(
    () => ({
      sortBy: sort.sortBy,
      sortDirection: sort.sortDirection,
    }),
    [sort.sortBy, sort.sortDirection]
  );

  const { cases, summary, pagination, currentPage, loading, error, goToPage, nextPage, prevPage, reload } =
    useCasesOverview(stableFilters, stableSort);

  const { syncing, message, progress, start } = useSyncAllProperties({
    onFinished: reload,
  });

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <h2 className="page-title">All Cases</h2>
          <p className="page-subtitle">Overview with filters and labels.</p>
        </div>

        <Button onClick={() => void start()} loading={syncing}>
          Sync All
        </Button>
      </section>

      <SyncProgressCard progress={progress} syncing={syncing} message={message} />

      <CasesSummaryCards summary={summary} />

      <CasesFilters filters={filters} onChange={setFilters} />

      {loading ? <p>Loading cases...</p> : null}
      {error ? <p className="text-error">{error}</p> : null}

      {!loading && !error && cases.length > 0 ? (
        <>
          <CasesTable cases={cases} sort={stableSort} onSortChange={setSort} />
          <PaginationControls
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onGoToPage={goToPage}
            onNext={nextPage}
            onPrev={prevPage}
          />
        </>
      ) : null}
      {!loading && !error && cases.length === 0 ? (
        <p style={{ padding: "20px", textAlign: "center", color: "#999" }}>
          No cases found
        </p>
      ) : null}
    </div>
  );
}
