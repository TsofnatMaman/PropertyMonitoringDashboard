import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  title: string;
  width?: string | number;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  getRowClassName?: (row: T, index: number) => string | undefined;
  emptyMessage?: string;
};

export default function DataTable<T>({
  columns,
  rows,
  getRowKey,
  getRowClassName,
  emptyMessage = "No data found.",
}: DataTableProps<T>) {
  if (!rows.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ width: column.width }}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className={getRowClassName?.(row, index)}
            >
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
