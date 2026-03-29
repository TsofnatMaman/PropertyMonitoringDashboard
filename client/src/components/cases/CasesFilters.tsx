import type { CaseFilters } from "../../types/case";

type CasesFiltersProps = {
  filters: CaseFilters;
  onChange: (next: CaseFilters) => void;
};

export default function CasesFilters({
  filters,
  onChange,
}: CasesFiltersProps) {
  return (
    <div className="filters-bar">
      <input
        className="filters-bar__search"
        type="text"
        value={filters.query || ""}
        onChange={(e) =>
          onChange({
            ...filters,
            query: e.target.value,
          })
        }
        placeholder="Search by case #, type, status, description, APN..."
      />

      <label className="checkbox-inline">
        <input
          type="checkbox"
          checked={Boolean(filters.openOnly)}
          onChange={(e) =>
            onChange({
              ...filters,
              openOnly: e.target.checked,
            })
          }
        />
        Open only
      </label>

      <label className="checkbox-inline">
        <input
          type="checkbox"
          checked={Boolean(filters.attentionOnly)}
          onChange={(e) =>
            onChange({
              ...filters,
              attentionOnly: e.target.checked,
            })
          }
        />
        Needs attention
      </label>

      <label className="checkbox-inline">
        <input
          type="checkbox"
          checked={Boolean(filters.urgentOnly)}
          onChange={(e) =>
            onChange({
              ...filters,
              urgentOnly: e.target.checked,
            })
          }
        />
        Urgent only
      </label>
      <label className="checkbox-inline">
        <input
          type="checkbox"
          checked={Boolean(filters.newActivityOnly)}
          onChange={(e) =>
            onChange({
              ...filters,
              newActivityOnly: e.target.checked,
            })
          }
        />
        New activity only
      </label>
    </div>
  );
}