"use client";

import { useEffect, useState, useCallback } from "react";
import { bookReferenceColumns } from "./columns";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type {
  BookReferenceWithHierarchy,
  BookReferencesApiResponse,
} from "./types";
import { Book } from "lucide-react";

const BASE_URL = "https://medijoddha.save71.net";

export default function BookReferencesPage() {
  const [bookRefs, setBookRefs] = useState<BookReferenceWithHierarchy[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const fetchBookReferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = `${BASE_URL}/api/book-refs?page=${currentPage}&limit=${pageSize}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch book references: ${res.status} ${res.statusText}`
        );
      }

      const data: BookReferencesApiResponse = await res.json();
      const bookRefsList = data.book_refs || [];

      // Enrich book references with hierarchy info
      const enrichedBookRefs = await Promise.all(
        bookRefsList.map(async (bookRef: BookReferenceWithHierarchy) => {
          try {
            // Fetch subject details
            const subjectRes = await fetch(
              `${BASE_URL}/api/subjects/${bookRef.subject_id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (subjectRes.ok) {
              const subjectData = await subjectRes.json();
              const subject = subjectData.subject;

              if (subject) {
                bookRef.subject_name = subject.name;
                bookRef.subject_title = subject.title;

                // Fetch course details if subject has course_id
                if (subject.course_id) {
                  const courseRes = await fetch(
                    `${BASE_URL}/api/courses/${subject.course_id}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    }
                  );

                  if (courseRes.ok) {
                    const courseData = await courseRes.json();
                    const course = courseData.course;
                    if (course) {
                      bookRef.course_name = course.name;

                      // Fetch program details if course has program_id
                      if (course.program_id) {
                        const programRes = await fetch(
                          `${BASE_URL}/api/programs/${course.program_id}`,
                          {
                            headers: {
                              Authorization: `Bearer ${token}`,
                              "Content-Type": "application/json",
                            },
                          }
                        );

                        if (programRes.ok) {
                          const programData = await programRes.json();
                          const program = programData.program;
                          if (program) {
                            bookRef.program_name = program.name;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error("Error fetching hierarchy:", err);
          }

          return bookRef;
        })
      );

      setBookRefs(enrichedBookRefs);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (err) {
      console.error("Error fetching book references:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load book references"
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchBookReferences();
  }, [fetchBookReferences]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handlePageChange = (newIndex: number) => {
    setCurrentPage(newIndex + 1);
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Book className="w-8 h-8 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold">Book References</h1>
            <p className="text-sm text-gray-600">Manage all reference books</p>
          </div>
        </div>
        <Link href="/book-refs/add-book-ref">
          <Button className="text-white hover:opacity-90">
            + Add Book Reference
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <Button onClick={() => fetchBookReferences()} variant="outline">
            Retry
          </Button>
        </div>
      ) : bookRefs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No book references found.</p>
          <Link href="/book-refs/add-book-ref">
            <Button className="mt-2">Add Your First Book Reference</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={bookReferenceColumns}
          data={bookRefs}
          totalItems={totalItems}
          pageIndex={currentPage - 1}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
