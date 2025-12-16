// app/chapters/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { ChapterWithSubject } from "./types";
import { ViewChapterModal } from "./ViewChapterModal";
import { EditChapterModal } from "./EditChapterModal";
import { DeleteChapterModal } from "./DeleteChapterModal";

// Thumbnail Component
function ChapterImageThumb({
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
function ChapterStatusCell({ chapter }: { chapter: ChapterWithSubject }) {
  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant={chapter.is_draft ? "default" : "outline"}
        className={`text-xs ${
          chapter.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
        }`}
      >
        {chapter.is_draft ? "Draft" : "Not Draft"}
      </Badge>
      <Badge
        variant={chapter.is_published ? "default" : "outline"}
        className={`text-xs ${
          chapter.is_published ? "bg-green-500 hover:bg-green-600" : ""
        }`}
      >
        {chapter.is_published ? "Published" : "Not Published"}
      </Badge>
    </div>
  );
}

// Table Columns
export const chapterColumns: ColumnDef<ChapterWithSubject>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono">#{row.original.id}</span>,
  },
  {
    accessorKey: "serial_id",
    header: "Serial",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.serial_id}</span>
    ),
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => (
      <ChapterImageThumb src={row.original.image} alt={row.original.name} />
    ),
  },
  {
    accessorKey: "name",
    header: "Chapter Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "title",
    header: "Chapter Title",
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.original.title}>
        {row.original.title}
      </div>
    ),
  },
  {
    accessorKey: "subject_name",
    header: "Subject",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.subject_name || `Subject #${row.original.subject_id}`}
        </div>
        <div className="text-xs text-gray-500">
          {row.original.subject_title}
        </div>
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
    cell: ({ row }) => <ChapterStatusCell chapter={row.original} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-1">
        <ViewChapterModal chapter={row.original} />
        <EditChapterModal chapter={row.original} />
        <DeleteChapterModal id={row.original.id} />
      </div>
    ),
  },
];
