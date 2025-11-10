// app/questions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { questionColumns, QuestionItem } from "./columns";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BASE_URL = "https://medijoddha.save71.net"; // ✅ No extra space

interface ApiResponse {
  questions: QuestionItem[];
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/api/questions?page=1&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch questions");

        const data: ApiResponse = await res.json();

        const formatted = data.questions.map((q) => ({
          ...q,
          answer: q.answer?.trim().toUpperCase() ?? "",
        }));

        setQuestions(formatted);
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

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
        <p className="text-center py-4">Loading...</p>
      ) : questions.length === 0 ? (
        <p className="text-center py-4 text-gray-500">No questions found.</p>
      ) : (
        <DataTable columns={questionColumns} data={questions} />
      )}
    </div>
  );
}
