"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import type { BookReferenceWithHierarchy } from "./types";
import { ViewBookReferenceModal } from "./ViewBookReferenceModal";
import { EditBookReferenceModal } from "./EditBookReferenceModal";
import { DeleteBookReferenceModal } from "./DeleteBookReferenceModal";

// Thumbnail Component
function BookImageThumb({
  src,
  alt,
}: {
  src: string | null | undefined;
  alt: string;
}) {
  if (!src || src === "")
    return <span className="text-gray-400">No image</span>;

  return (
    <div className="relative w-12 h-16 rounded overflow-hidden border shadow-sm">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="48px"
        className="object-cover"
        unoptimized
        onError={(e) => {
          console.error(`Failed to load image: ${src}`);
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

// Hierarchy Cell Component
function HierarchyCell({ bookRef }: { bookRef: BookReferenceWithHierarchy }) {
  return (
    <div className="text-xs">
      <div className="font-medium">
        {bookRef.subject_name || `Subject #${bookRef.subject_id}`}
      </div>
      {bookRef.subject_name && (
        <div className="text-gray-500 truncate">
          {bookRef.program_name && <span>{bookRef.program_name} → </span>}
          {bookRef.course_name && <span>{bookRef.course_name} → </span>}
          {bookRef.subject_name}
        </div>
      )}
    </div>
  );
}

// Table Columns
export const bookReferenceColumns: ColumnDef<BookReferenceWithHierarchy>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono">#{row.original.id}</span>,
  },

  {
    accessorKey: "image",
    header: "Cover",
    cell: ({ row }) => (
      <BookImageThumb src={row.original.image} alt={row.original.name} />
    ),
  },
  {
    accessorKey: "name",
    header: "Book Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "hierarchy",
    header: "Subject",
    cell: ({ row }) => <HierarchyCell bookRef={row.original} />,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <div className="text-xs text-gray-500">
        {row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString()
          : "-"}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-1">
        <ViewBookReferenceModal bookRef={row.original} />
        <EditBookReferenceModal bookRef={row.original} />
        <DeleteBookReferenceModal id={row.original.id} />
      </div>
    ),
  },
];
