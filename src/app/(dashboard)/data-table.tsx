"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
// import { useState, useEffect } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalItems: number; // Total from API
  pageIndex: number; // Controlled externally
  pageSize: number; // Controlled externally
  onPageChange: (newIndex: number) => void;
  onPageSizeChange: (newSize: number) => void;
  loading?: boolean;
  error?: string | null;
  meta?: {
    updateUser?: (userId: string, updates: Partial<TData>) => void;
    deleteUser?: (userId: string) => void;
    refetchData?: () => void;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalItems,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  meta,
}: DataTableProps<TData, TValue>) {
  // React Table now just renders — no internal pagination logic
  const table = useReactTable({
    data,
    columns,
    meta,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // 👈 Important!
    pageCount: Math.ceil(totalItems / pageSize),
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    // Disable built-in pagination handlers
    onPaginationChange: () => {}, // no-op
  });

  return (
    <Card className="p-4 mt-5 w-full max-w-7xl">
      <div className="w-full overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted text-muted-foreground"
              >
                {headerGroup.headers.map((header, i) => (
                  <TableHead
                    key={header.id}
                    className={`py-3 px-4 text-sm font-semibold border-1 ${
                      i === 0 ? "rounded-tl-lg" : ""
                    } ${
                      i === headerGroup.headers.length - 1
                        ? "rounded-tr-lg"
                        : ""
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {data?.length ? (
              table.getRowModel().rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  className={`transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-muted/50"
                  } hover:bg-muted/70`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {pageIndex + 1} of {Math.ceil(totalItems / pageSize)} •{" "}
            {data.length} of {totalItems} rows
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="rowsPerPage"
              className="text-sm text-muted-foreground"
            >
              Rows per page:
            </label>
            <select
              id="rowsPerPage"
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[5, 8, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageIndex - 1)}
              disabled={pageIndex <= 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageIndex + 1)}
              disabled={(pageIndex + 1) * pageSize >= totalItems}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
