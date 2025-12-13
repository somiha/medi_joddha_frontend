// app/subjects/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { Subject } from "./types";
import { ViewSubjectModal } from "./ViewSubjectModal";
import { EditSubjectModal } from "./EditSubjectModal";
import { DeleteSubjectModal } from "./DeleteSubjectModal";

// Thumbnail Component
function SubjectImageThumb({
  src,
  alt,
}: {
  src: string | null | undefined;
  alt: string;
}) {
  if (!src) return <span className="text-gray-400">No image</span>;

  return (
    <div className="relative w-16 h-16 rounded overflow-hidden border">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="64px"
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

// Status Cell Component
function SubjectStatusCell({ subject }: { subject: Subject }) {
  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant={subject.is_draft ? "default" : "outline"}
        className={`text-xs ${
          subject.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
        }`}
      >
        {subject.is_draft ? "Draft" : "Not Draft"}
      </Badge>
      <Badge
        variant={subject.is_published ? "default" : "outline"}
        className={`text-xs ${
          subject.is_published ? "bg-green-500 hover:bg-green-600" : ""
        }`}
      >
        {subject.is_published ? "Published" : "Not Published"}
      </Badge>
    </div>
  );
}

// Table Columns
export const subjectColumns: ColumnDef<Subject>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono">#{row.original.id}</span>,
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => (
      <SubjectImageThumb src={row.original.image} alt={row.original.name} />
    ),
  },
  {
    accessorKey: "name",
    header: "Subject Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "title",
    header: "Subject Title",
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.original.title}>
        {row.original.title}
      </div>
    ),
  },
  {
    accessorKey: "short_des",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.original.short_des}>
        {row.original.short_des}
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <SubjectStatusCell subject={row.original} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-1">
        <ViewSubjectModal subject={row.original} />
        <EditSubjectModal subject={row.original} />
        <DeleteSubjectModal id={row.original.id} />
      </div>
    ),
  },
];
