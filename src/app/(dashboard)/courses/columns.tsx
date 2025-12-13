// app/courses/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { CourseItem } from "./types";
import { ViewCourseModal } from "./ViewCourseModal";
import { EditCourseModal } from "./EditCourseModal";
import { DeleteCourseModal } from "./DeleteCourseModal";

// Thumbnail Component
function ImageThumb({
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

// Simple component for Program cell - NO API CALLS HERE
function ProgramCell({ programId }: { programId: number }) {
  // Just show the ID - actual name will be fetched only when needed (in modals)
  return <span>Program #{programId}</span>;
}

// Status Cell Component
function StatusCell({ course }: { course: CourseItem }) {
  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant={course.is_draft ? "default" : "outline"}
        className={`text-xs ${
          course.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
        }`}
      >
        {course.is_draft ? "Draft" : "Not Draft"}
      </Badge>
      <Badge
        variant={course.is_published ? "default" : "outline"}
        className={`text-xs ${
          course.is_published ? "bg-green-500 hover:bg-green-600" : ""
        }`}
      >
        {course.is_published ? "Published" : "Not Published"}
      </Badge>
    </div>
  );
}

// Table Columns - NO API calls in cells
export const courseColumns: ColumnDef<CourseItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono">#{row.original.id}</span>,
  },
  {
    accessorKey: "program_id",
    header: "Program",
    cell: ({ row }) => <ProgramCell programId={row.original.program_id} />,
  },
  {
    accessorKey: "name",
    header: "Course Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "title",
    header: "Course Title",
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.original.title}>
        {row.original.title}
      </div>
    ),
  },
  {
    id: "image",
    header: "Image",
    cell: ({ row }) => (
      <ImageThumb src={row.original.image} alt={row.original.name} />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusCell course={row.original} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-1">
        <ViewCourseModal course={row.original} />
        <EditCourseModal course={row.original} />
        <DeleteCourseModal id={row.original.id} />
      </div>
    ),
  },
];
