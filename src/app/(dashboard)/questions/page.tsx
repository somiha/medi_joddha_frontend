// app/questions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { questionColumns, QuestionItem } from "./columns";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BASE_URL = "https://medijoddha.save71.net";

interface ApiResponse {
  questions: QuestionItem[];
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log(
          "Fetching questions from:",
          `${BASE_URL}/api/questions?page=1&limit=100`
        );

        const res = await fetch(`${BASE_URL}/api/questions?page=1&limit=100`);

        console.log("Response status:", res.status);

        if (!res.ok) {
          throw new Error(
            `Failed to fetch questions: ${res.status} ${res.statusText}`
          );
        }

        const data: ApiResponse = await res.json();
        console.log("Received data:", data);

        const formatted =
          data.questions?.map((q) => ({
            ...q,
            answer: q.answer?.trim().toUpperCase() ?? "",
          })) || [];

        console.log("Formatted questions:", formatted);
        setQuestions(formatted);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load questions"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Debug: Check what's happening
  console.log("Current state:", { loading, questions, error });

  return (
    <div className="flex flex-col min-h-screen w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Questions</h1>
        <Link href="/questions/add-question">
          <Button className=" text-white hover:opacity-90">
            + Add Question
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-center py-4">Loading questions...</p>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <p className="text-sm text-gray-600">
            Check the browser console for more details.
          </p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 mb-4">No questions found.</p>
          <p className="text-sm text-gray-600">This could mean:</p>
          <ul className="text-sm text-gray-600 list-disc list-inside mt-2">
            <li>The API endpoint is not accessible</li>
            <li>There are no questions in the database</li>
            <li>The API response structure is different than expected</li>
          </ul>
        </div>
      ) : (
        <DataTable columns={questionColumns} data={questions} />
      )}
    </div>
  );
}
