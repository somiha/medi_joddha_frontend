// app/courses/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { courseColumns } from "./columns";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { CourseItem, ApiResponse } from "./types";
import { BookOpen } from "lucide-react";

const BASE_URL = "https://medijoddha.save71.net";

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = `${BASE_URL}/api/courses?page=${currentPage}&limit=${pageSize}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch courses: ${res.status} ${res.statusText}`
        );
      }

      const data: ApiResponse = await res.json();

      setCourses(data.courses || []);
      setTotalItems(data.pagination.totalItems || 0);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Courses</h1>
        <div className="flex gap-2">
          <Link href="/courses/subjects">
            <Button variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Manage Subjects
            </Button>
          </Link>
          <Link href="/courses/add-course">
            <Button className="text-white hover:opacity-90">
              + Add Course
            </Button>
          </Link>
        </div>
      </div>
      {loading ? (
        <p className="text-center py-4">Loading courses...</p>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <Button onClick={() => fetchCourses()} variant="outline">
            Retry
          </Button>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No courses found.</p>
          <Link href="/courses/add-course">
            <Button className="mt-2">Create Your First Course</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={courseColumns}
          data={courses}
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
