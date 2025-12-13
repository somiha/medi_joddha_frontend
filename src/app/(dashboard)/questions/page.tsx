// app/questions/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { questionColumns, QuestionItem } from "./columns";
import { DataTable } from "../data-table"; // Make sure this is the updated version
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BASE_URL = "https://medijoddha.save71.net";

interface ApiResponse {
  questions: QuestionItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    // pageSize may not be in response — so we track it ourselves
  };
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1); // 1-based to match API
  const [pageSize, setPageSize] = useState<number>(8); // default page size

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${BASE_URL}/api/questions?page=${currentPage}&limit=${pageSize}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(
          `Failed to fetch questions: ${res.status} ${res.statusText}`
        );
      }

      const data: ApiResponse = await res.json();

      const formatted =
        data.questions?.map((q) => ({
          ...q,
          answer: q.answer?.trim().toUpperCase() ?? "",
        })) || [];

      setQuestions(formatted);
      setTotalItems(data.pagination.totalItems || 0);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]); // Add dependencies

  // Then in useEffect
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Questions</h1>
        <Link href="/questions/add-question">
          <Button className="text-white hover:opacity-90">
            + Add Question
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-center py-4">Loading questions...</p>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No questions found.</p>
        </div>
      ) : (
        <DataTable
          columns={questionColumns}
          data={questions}
          totalItems={totalItems}
          pageIndex={currentPage - 1} // React Table uses 0-based index
          pageSize={pageSize}
          onPageChange={(newIndex) => setCurrentPage(newIndex + 1)} // convert back to 1-based
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
