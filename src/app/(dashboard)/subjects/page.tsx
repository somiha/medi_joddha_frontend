// app/subjects/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { subjectColumns } from "./columns";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Subject, ApiResponse } from "./types";
import { BookOpen } from "lucide-react";

const BASE_URL = "https://medijoddha.save71.net";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = `${BASE_URL}/api/subjects?page=${currentPage}&limit=${pageSize}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch subjects: ${res.status} ${res.statusText}`
        );
      }

      const data: ApiResponse = await res.json();

      setSubjects(data.subjects || []);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setError(err instanceof Error ? err.message : "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold">Subjects</h1>
            <p className="text-sm text-gray-600">Manage all subjects</p>
          </div>
        </div>
        <Link href="/subjects/add-subject">
          <Button className="text-white hover:opacity-90">+ Add Subject</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-center py-4">Loading subjects...</p>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <Button onClick={() => fetchSubjects()} variant="outline">
            Retry
          </Button>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No subjects found.</p>
          <Link href="/courses/subjects/add-subject">
            <Button className="mt-2">Create Your First Subject</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={subjectColumns}
          data={subjects}
          totalItems={totalItems}
          pageIndex={currentPage - 1}
          pageSize={pageSize}
          onPageChange={(newIndex) => setCurrentPage(newIndex + 1)}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
