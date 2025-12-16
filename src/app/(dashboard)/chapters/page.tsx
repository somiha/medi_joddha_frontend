// app/courses/chapters/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { chapterColumns } from "./columns";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ChapterWithSubject, ApiResponse } from "./types";

import { FileText } from "lucide-react";

const BASE_URL = "https://medijoddha.save71.net";

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<ChapterWithSubject[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const fetchChapters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = `${BASE_URL}/api/chapters?page=${currentPage}&limit=${pageSize}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch chapters: ${res.status} ${res.statusText}`
        );
      }

      const data: ApiResponse = await res.json();
      const chaptersList = data.chapters || [];

      // Enrich chapters with subject info
      const enrichedChapters = await Promise.all(
        chaptersList.map(async (chapter: ChapterWithSubject) => {
          try {
            // Fetch subject details
            const subjectRes = await fetch(
              `${BASE_URL}/api/subjects/${chapter.subject_id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (subjectRes.ok) {
              const subjectData = await subjectRes.json();
              return {
                ...chapter,
                subject_name:
                  subjectData.subject?.name || `Subject #${chapter.subject_id}`,
                subject_title: subjectData.subject?.title || "",
              };
            }
          } catch (err) {
            console.error("Error fetching subject:", err);
          }

          return chapter;
        })
      );

      setChapters(enrichedChapters);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (err) {
      console.error("Error fetching chapters:", err);
      setError(err instanceof Error ? err.message : "Failed to load chapters");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Type the onPageChange function parameter
  const handlePageChange = (newIndex: number) => {
    setCurrentPage(newIndex + 1);
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold">Chapters</h1>
            <p className="text-sm text-gray-600">Manage all chapters</p>
          </div>
        </div>
        <Link href="/chapters/add-chapter">
          <Button className="text-white hover:opacity-90">+ Add Chapter</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-center py-4">Loading chapters...</p>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <Button onClick={() => fetchChapters()} variant="outline">
            Retry
          </Button>
        </div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No chapters found.</p>
          <Link href="/courses/chapters/add-chapter">
            <Button className="mt-2">Create Your First Chapter</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={chapterColumns}
          data={chapters}
          totalItems={totalItems}
          pageIndex={currentPage - 1}
          pageSize={pageSize}
          onPageChange={handlePageChange} // Use the typed function
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
