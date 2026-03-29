import type { Property } from "../../types/property";
import { formatDateTime } from "../../utils/date";
import Card from "../ui/Card";
import DataTable, { type DataTableColumn } from "../ui/DataTable";

type PropertiesTableProps = {
  properties: Property[];
};

export default function PropertiesTable({ properties }: PropertiesTableProps) {
  const columns: DataTableColumn<Property>[] = [
    {
      key: "apn",
      title: "APN",
      render: (row) => row.apn,
    },
    {
      key: "description",
      title: "Description",
      render: (row) => row.description || "-",
    },
    {
      key: "created_at",
      title: "Created At",
      render: (row) => formatDateTime(row.created_at),
    },
  ];

  return (
    <Card
      title="Tracked Properties"
      subtitle={`Currently tracking ${properties.length} properties.`}
    >
      <DataTable
        columns={columns}
        rows={properties}
        getRowKey={(row, index) => row.id ?? row.apn ?? index}
        emptyMessage="No properties found."
      />
    </Card>
  );
}
