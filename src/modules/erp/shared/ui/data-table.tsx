import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;

  cell: (
    item: T,
  ) => ReactNode;
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
    <div className="overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors">
            {columns.map((column) => (
              <th
                key={column.key}
                className="h-10 px-4 text-left align-middle font-medium text-muted-foreground"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="[&_tr:last-child]:border-0">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={getRowKey(
                  item,
                  index,
                )}
                className="border-b transition-colors hover:bg-muted/50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="p-4 align-middle"
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