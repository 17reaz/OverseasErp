// src/modules/erp/shared/ui/data-table.tsx

import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (
    item: T,
    index: number,
  ) => string | number;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`h-10 px-4 text-left align-middle font-medium text-muted-foreground ${
                  column.className ?? ""
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="h-24 px-4 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={getRowKey(item, index)}
                className="border-b transition-colors hover:bg-muted/50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 align-middle ${
                      column.className ?? ""
                    }`}
                  >
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}