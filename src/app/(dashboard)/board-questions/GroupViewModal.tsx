"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

const BASE_URL = "https://medijoddha.save71.net";

interface GroupedQuestion {
  key: string;
  board_id: number;
  board_name: string;
  year: string;
  subject_id?: number;
  subject_name?: string;
  chapter_id?: number;
  chapter_name?: string;
  question_ids: number[];
  count: number;
}

interface ApiQuestionDetail {
  id: number;
  question_id: number;
  question_text: string;
  answer?: string;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  option4?: string | null;
  option5?: string | null;
  is_published?: boolean;
  subject_id?: number;
  chapter_id?: number;
  chapter_name?: string;
}

interface SafeQuestion {
  id: number;
  question_id: number;
  question_text: string;
  answer?: string;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  option4?: string | null;
  option5?: string | null;
  is_published?: boolean;
  subject_id?: number;
  chapter_id?: number;
  chapter_name?: string;
}

export default function GroupViewModal({
  group,
  isOpen,
  onClose,
}: {
  group: GroupedQuestion;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [chaptersMap, setChaptersMap] = useState<Map<number, string>>(
    new Map()
  );

  // Fetch chapters separately to get chapter names
  useEffect(() => {
    const fetchChapters = async () => {
      if (!group.subject_id) return;

      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${BASE_URL}/api/chapters?subject_id=${group.subject_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const chapters = data.chapters || [];
          const map = new Map<number, string>();
          chapters.forEach((chapter: { id: number; name: string }) => {
            map.set(chapter.id, chapter.name);
          });
          setChaptersMap(map);
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
      }
    };

    if (isOpen && group.subject_id) {
      fetchChapters();
    }
  }, [isOpen, group.subject_id]);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const fetchGroup = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("No auth token found");
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        params.append("board_id", group.board_id.toString());
        params.append("year", group.year);
        if (group.subject_id) {
          params.append("subject_id", group.subject_id.toString());
        }

        console.log("Fetching group questions with params:", params.toString());

        const response = await fetch(
          `${BASE_URL}/api/board-questions?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const responseText = await response.text();

        if (response.ok) {
          const json = JSON.parse(responseText);

          const safeData: SafeQuestion[] = json.data.data.map(
            (item: ApiQuestionDetail) => ({
              id: item.id,
              question_id: item.question_id,
              question_text:
                item.question_text || `Question ${item.question_id}`,
              answer: item.answer || "",
              option1: item.option1 || null,
              option2: item.option2 || null,
              option3: item.option3 || null,
              option4: item.option4 || null,
              option5: item.option5 || null,
              is_published: item.is_published || false,
              subject_id: item.subject_id,
              chapter_id: item.chapter_id,
              // Use chapter_name from API if available, otherwise use chaptersMap
              chapter_name:
                item.chapter_name ||
                (item.chapter_id ? chaptersMap.get(item.chapter_id) : "") ||
                "",
            })
          );
          console.log("Processed questions:", safeData);
          setQuestions(safeData);
        } else {
          console.error("Failed to fetch group questions:", response.status);
          const errorText = await response.text();
          console.error("Error response:", errorText);
        }
      } catch (err) {
        console.error("Failed to load group questions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [isOpen, group, chaptersMap]);

  const renderOptions = (q: SafeQuestion) => {
    const options = [
      { key: "A", value: q.option1 },
      { key: "B", value: q.option2 },
      { key: "C", value: q.option3 },
      { key: "D", value: q.option4 },
      { key: "E", value: q.option5 },
    ];

    const validOptions = options.filter(
      (opt) =>
        opt.value && typeof opt.value === "string" && opt.value.trim() !== ""
    );

    if (validOptions.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {validOptions.map((opt, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <Badge variant="outline" className="shrink-0 mt-0.5">
              {opt.key}
            </Badge>
            <span className="text-gray-600">{opt.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Count questions per chapter
  const getChapterStats = () => {
    const stats: Record<string, { name: string; count: number }> = {};

    questions.forEach((question) => {
      const chapterName = question.chapter_name || "Unknown Chapter";
      if (!stats[chapterName]) {
        stats[chapterName] = { name: chapterName, count: 0 };
      }
      stats[chapterName].count++;
    });

    return Object.values(stats);
  };

  const chapterStats = getChapterStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Questions ({questions.length})
          </DialogTitle>
          <DialogDescription>
            All questions for {group.board_name} - {group.year}
            {group.subject_name && ` - ${group.subject_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-blue-700 mb-1">Board</p>
                <p className="font-bold">{group.board_name}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 mb-1">Year</p>
                <p className="font-bold">{group.year}</p>
              </div>
              {group.subject_name && (
                <div>
                  <p className="text-sm text-blue-700 mb-1">Subject</p>
                  <p className="font-bold">{group.subject_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Questions</p>
                <p className="text-2xl font-bold">{group.count}</p>
              </div>
            </div>

            {/* Chapter Distribution */}
            {chapterStats.length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <p className="text-sm font-medium text-blue-700">
                    Chapters Distribution
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {chapterStats.map((stat) => (
                    <Badge
                      key={stat.name}
                      variant="outline"
                      className="bg-white"
                    >
                      {stat.name}: {stat.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Questions List */}
          {loading ? (
            <div className="text-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-gray-600">No questions found in this group</p>
              <p className="text-sm text-gray-500 mt-2">
                Board: {group.board_name}, Year: {group.year}
                {group.subject_name && `, Subject: ${group.subject_name}`}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  All Questions ({questions.length})
                </h3>
                <Badge variant="outline">
                  Showing {questions.length} of {group.count} questions
                </Badge>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <Card key={`${q.id}-${index}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-1 shrink-0">
                            #{index + 1}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono">
                                QID: {q.question_id}
                              </Badge>
                              {q.chapter_name && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {q.chapter_name}
                                </Badge>
                              )}
                              {q.is_published ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Published
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-gray-600"
                                >
                                  Draft
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-gray-800 mb-2 break-words">
                              {q.question_text}
                            </p>
                            {renderOptions(q)}
                            {q.answer && (
                              <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                                <p className="text-sm font-medium text-green-800 mb-1">
                                  Answer:
                                </p>
                                <p className="text-green-900 font-medium">
                                  {q.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
