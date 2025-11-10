"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  getPaginationRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

// import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  error?: string | null;
  onActionComplete?: () => void;
  meta?: {
    updateUser?: (userId: string, updates: Partial<TData>) => void;
    deleteUser?: (userId: string) => void;
    refetchData?: () => void;
    refreshData?: () => void;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
}: DataTableProps<TData, TValue>) {
  const [pageSize, setPageSize] = useState(8);

  const table = useReactTable({
    data,
    columns,
    meta,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  return (
    <Card className="p-4 mt-5 w-full max-w-7xl">
      <div className="mb-4">
        {/* <div className="mb-4 relative">
          <Input placeholder="Search User" className="max-w-sm pl-10" />
          <Search className="absolute p-1 h-6 w-6 text-gray-400 left-2 top-2" />
        </div> */}
      </div>

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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()} • {table.getRowModel().rows.length} of{" "}
            {data.length} rows
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
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                table.setPageSize(newSize);
              }}
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
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
