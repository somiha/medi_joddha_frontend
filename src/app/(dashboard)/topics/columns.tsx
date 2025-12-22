"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { TopicWithHierarchy } from "./types";
import { ViewTopicModal } from "./ViewTopicModal";
import { EditTopicModal } from "./EditTopicModal";
import { DeleteTopicModal } from "./DeleteTopicModal";

// Thumbnail Component
function TopicImageThumb({
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
function TopicStatusCell({ topic }: { topic: TopicWithHierarchy }) {
  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant={topic.is_draft ? "default" : "outline"}
        className={`text-xs ${
          topic.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
        }`}
      >
        {topic.is_draft ? "Draft" : "Not Draft"}
      </Badge>
      <Badge
        variant={topic.is_published ? "default" : "outline"}
        className={`text-xs ${
          topic.is_published ? "bg-green-500 hover:bg-green-600" : ""
        }`}
      >
        {topic.is_published ? "Published" : "Not Published"}
      </Badge>
    </div>
  );
}

// Hierarchy Cell Component
function HierarchyCell({ topic }: { topic: TopicWithHierarchy }) {
  return (
    <div className="text-xs">
      <div className="font-medium">
        {topic.chapter_name || `Chapter #${topic.chapter_id}`}
      </div>
      {topic.subject_name && (
        <div className="text-gray-500 truncate">
          {topic.program_name && <span>{topic.program_name} → </span>}
          {topic.course_name && <span>{topic.course_name} → </span>}
          {topic.subject_name}
        </div>
      )}
    </div>
  );
}

// Table Columns
export const topicColumns: ColumnDef<TopicWithHierarchy>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono">#{row.original.id}</span>,
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => (
      <TopicImageThumb src={row.original.image} alt={row.original.name} />
    ),
  },
  {
    accessorKey: "name",
    header: "Topic Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "title",
    header: "Topic Title",
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.original.title}>
        {row.original.title}
      </div>
    ),
  },
  {
    accessorKey: "hierarchy",
    header: "Hierarchy",
    cell: ({ row }) => <HierarchyCell topic={row.original} />,
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
    cell: ({ row }) => <TopicStatusCell topic={row.original} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-1">
        <ViewTopicModal topic={row.original} />
        <EditTopicModal topic={row.original} />
        <DeleteTopicModal id={row.original.id} />
      </div>
    ),
  },
];
