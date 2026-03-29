import type { CaseItem } from "../../types/case";
import { buildCaseUrl } from "../../utils/caseLinks";
import { formatDateTime } from "../../utils/date";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import DataTable, { type DataTableColumn } from "../ui/DataTable";

type CasesTableProps = {
  cases: CaseItem[];
};

export default function CasesTable({ cases }: CasesTableProps) {
  const columns: DataTableColumn<CaseItem>[] = [
    {
      key: "description",
      title: "Property Description",
      render: (row) => row.description || "-",
    },
    {
      key: "apn",
      title: "APN",
      render: (row) => row.apn || "-",
    },
    {
      key: "case_number",
      title: "Case #",
      render: (row) => {
        const caseUrl = buildCaseUrl({
          apn: row.apn,
          caseNumber: row.case_number,
          caseTypeId: row.case_type_id,
        });

        return caseUrl ? (
          <a
            href={caseUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="case-link"
            title="Open original case page"
          >
            {row.case_number}
          </a>
        ) : (
          row.case_number || "-"
        );
      },
    },
    {
      key: "case_type",
      title: "Type",
      render: (row) => row.case_type || "-",
    },
    {
      key: "latest_status",
      title: "Latest Status",
      render: (row) => row.latest_status || "-",
    },
    {
      key: "latest_activity_date",
      title: "Latest Activity",
      render: (row) => formatDateTime(row.latest_activity_date),
    },
    {
      key: "flags",
      title: "Flags",
      render: (row) => (
        <div className="badges">
          {row.flags?.isOpen ? <Badge text="OPEN" tone="open" /> : null}
          {row.flags?.needsAttention ? (
            <Badge text="ATTENTION" tone="attention" />
          ) : null}
          {row.flags?.isUrgent ? <Badge text="URGENT" tone="urgent" /> : null}
          {row.flags?.hasNewActivity ? (
            <Badge text="NEW ACTIVITY" tone="new-activity" />
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Cases"
      subtitle={`Showing ${cases.length} cases after filtering.`}
    >
      <DataTable
        columns={columns}
        rows={cases}
        getRowKey={(row) => row.id}
        getRowClassName={(row) => buildRowClassName(row)}
        emptyMessage="No cases found."
      />
    </Card>
  );
}

function buildRowClassName(row: CaseItem) {
  const classes = ["case-row"];

  if (row.flags?.isUrgent) classes.push("case-row--urgent");
  if (row.flags?.needsAttention) classes.push("case-row--attention");
  if (row.flags?.hasNewActivity) classes.push("case-row--new");

  return classes.join(" ");
}
