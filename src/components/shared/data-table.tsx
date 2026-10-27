import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

export type DataColumn<T> = {
  id: string;
  label: string;
  cell: (row: T) => ReactNode;
};
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
}) {
  if (!rows.length)
    return (
      <EmptyState
        title="Ainda sem registos"
        description="Os registos aparecerão aqui quando estiverem disponíveis."
      />
    );
  return (
    <div className="bg-card min-w-0 rounded-xl border">
      <Table>
        <TableCaption className="pb-4">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead scope="col" key={column.id}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
