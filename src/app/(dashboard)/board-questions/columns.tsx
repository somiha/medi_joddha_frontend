"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  Pencil,
  Trash,
  Search,
  CheckSquare,
  Square,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const BASE_URL = "https://medijoddha.save71.net";

export interface BoardQuestionItem {
  id: number;
  board_id: number;
  question_id: number;
  year: string;
  board_name: string;
  question: string;
  answer?: string;
  question_options?: {
    option1?: string;
    option2?: string;
    option3?: string;
    option4?: string;
    option5?: string;
  };
  is_draft: boolean;
  is_published: boolean;
  subject_id?: number;
  chapter_id?: number;
  subject_name?: string;
  chapter_name?: string;
  group_key?: string;
}

// Interface for the API response in ViewModal
interface ApiBoardQuestionDetail {
  id: number;
  board_id: number;
  board_name: string;
  question_id: number;
  year: string;
  question_text: string;
  answer?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  subject_id?: number;
  subject_name?: string;
  chapter_id?: number;
  chapter_name?: string;
}

interface ApiGroupResponse {
  data: ApiBoardQuestionDetail[];
  message?: string;
}

// Interfaces for dropdown data
interface Board {
  id: number;
  name: string;
  short_name?: string;
}

interface Question {
  id: number;
  question: string;
  answer?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  is_draft?: boolean;
  is_published?: boolean;
}

interface ApiQuestionsResponse {
  questions: Question[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// View Mapping Modal - Shows ALL questions in the same group
function ViewMappingModal({ item }: { item: BoardQuestionItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const [groupQuestions, setGroupQuestions] = useState<BoardQuestionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGroupQuestions = async () => {
    if (!item.group_key) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const [boardId, year, subjectId, chapterId] = item.group_key.split("-");

      // Build query to get all questions in this group
      const params = new URLSearchParams({
        board_id: boardId,
        year: year,
        ...(subjectId && subjectId !== "null" && { subject_id: subjectId }),
        ...(chapterId && chapterId !== "null" && { chapter_id: chapterId }),
      });

      const res = await fetch(`${BASE_URL}/api/board-questions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data: ApiGroupResponse = await res.json();

        // Transform to BoardQuestionItem format
        const questions: BoardQuestionItem[] = data.data.map(
          (q: ApiBoardQuestionDetail) => ({
            id: q.id,
            board_id: q.board_id,
            question_id: q.question_id,
            year: q.year,
            board_name: q.board_name || `Board ${q.board_id}`,
            question: q.question_text || `Question ${q.question_id}`,
            answer: q.answer || "",
            question_options: {
              option1: q.option1,
              option2: q.option2,
              option3: q.option3,
              option4: q.option4,
              option5: q.option5,
            },
            is_draft: false,
            is_published: true,
            subject_id: q.subject_id,
            chapter_id: q.chapter_id,
            subject_name: q.subject_name,
            chapter_name: q.chapter_name,
          })
        );
        setGroupQuestions(questions);
      }
    } catch (error) {
      console.error("Error fetching group questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchGroupQuestions();
  };

  const renderOptions = (options?: { [key: string]: string | undefined }) => {
    if (!options) return null;

    const optionArray = [
      { key: "option1", value: options.option1 },
      { key: "option2", value: options.option2 },
      { key: "option3", value: options.option3 },
      { key: "option4", value: options.option4 },
      { key: "option5", value: options.option5 },
    ].filter(
      (opt): opt is { key: string; value: string } =>
        opt.value !== undefined && opt.value.trim() !== ""
    );

    if (optionArray.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {optionArray.map((opt, index) => (
          <div key={opt.key} className="flex items-start gap-2 text-sm">
            <Badge variant="outline" className="shrink-0 mt-0.5">
              {String.fromCharCode(65 + index)}
            </Badge>
            <span className="text-gray-600">{opt.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={handleOpen}
      >
        <Eye className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Group Questions ({groupQuestions.length})
            </DialogTitle>
            <DialogDescription>
              All questions for {item.board_name} - {item.year}
              {item.subject_name && ` - ${item.subject_name}`}
              {item.chapter_name && ` - ${item.chapter_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Group Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Board</p>
                  <p className="font-bold">{item.board_name}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Year</p>
                  <p className="font-bold">{item.year}</p>
                </div>
                {item.subject_name && (
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Subject</p>
                    <p className="font-bold">{item.subject_name}</p>
                  </div>
                )}
                {item.chapter_name && (
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Chapter</p>
                    <p className="font-bold">{item.chapter_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Questions List */}
            {loading ? (
              <div className="text-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading group questions...</p>
              </div>
            ) : groupQuestions.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-gray-600">
                  No other questions in this group
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {groupQuestions.map((groupItem, index) => (
                    <Card
                      key={groupItem.id}
                      className={
                        groupItem.id === item.id
                          ? "border-primary border-2"
                          : ""
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-1">
                            #{index + 1}
                          </Badge>
                          <div className="flex-1">
                            {groupItem.id === item.id && (
                              <Badge className="mb-2 bg-primary">Current</Badge>
                            )}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  QID: {groupItem.question_id}
                                </Badge>
                              </div>
                            </div>
                            <p className="font-medium text-gray-800 mb-2">
                              {groupItem.question}
                            </p>

                            {renderOptions(groupItem.question_options)}

                            {/* Answer */}
                            {groupItem.answer && (
                              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                <p className="text-sm font-medium text-green-800">
                                  Answer:
                                </p>
                                <p className="text-green-900">
                                  {groupItem.answer}
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
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Edit Mapping Modal - Shows selected question first
function EditMappingModal({
  item,
  onSuccess,
}: {
  item: BoardQuestionItem;
  onSuccess?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    board_id: item.board_id,
    year: item.year,
    question_id: item.question_id,
  });
  const [boards, setBoards] = useState<Board[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([
    item.question_id,
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Fetch boards
      const boardsRes = await fetch(`${BASE_URL}/api/boards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (boardsRes.ok) {
        const boardsData = await boardsRes.json();
        setBoards(boardsData.boards || []);
      }

      // Fetch questions for the first time
      await fetchQuestions(1);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchQuestions = async (
    page: number = 1,
    search: string = searchTerm
  ) => {
    try {
      setLoadingQuestions(true);
      const token = localStorage.getItem("authToken");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search) {
        params.append("search", search);
      }

      const res = await fetch(`${BASE_URL}/api/questions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data: ApiQuestionsResponse = await res.json();
        let questionsData = data.questions || [];

        // Reorder to show selected question first
        questionsData = questionsData.sort((a: Question, b: Question) => {
          if (a.id === item.question_id) return -1;
          if (b.id === item.question_id) return 1;
          return 0;
        });

        setQuestions(questionsData);
        setPagination(
          data.pagination || {
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
            hasNext: false,
            hasPrev: false,
          }
        );
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchData();
  };

  const toggleQuestion = (questionId: number) => {
    setSelectedQuestions([questionId]);
    setForm({ ...form, question_id: questionId });
  };

  const handleSave = async () => {
    if (!form.board_id || !form.year || !form.question_id) {
      alert("Please select board, year, and a question");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${BASE_URL}/api/board-questions/${item.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Mapping updated successfully!");
        onSuccess?.();
        setIsOpen(false);
      } else {
        alert(`Update failed: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Update failed - check console for details");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchQuestions(page);
  };

  const handleSearch = () => {
    fetchQuestions(1, searchTerm);
  };

  const renderOptions = (question: Question) => {
    const options = [
      { key: "option1", value: question.option1 },
      { key: "option2", value: question.option2 },
      { key: "option3", value: question.option3 },
      { key: "option4", value: question.option4 },
      { key: "option5", value: question.option5 },
    ].filter(
      (opt): opt is { key: string; value: string } =>
        opt.value !== undefined && opt.value.trim() !== ""
    );

    if (options.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {options.map((opt, index) => (
          <div key={opt.key} className="flex items-start gap-2 text-sm">
            <Badge variant="outline" className="shrink-0 mt-0.5">
              {String.fromCharCode(65 + index)}
            </Badge>
            <span className="text-gray-600">{opt.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={handleOpen}
      >
        <Pencil className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Mapping #{item.id}</DialogTitle>
            <DialogDescription>
              Update board, year, and select a new question
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Board and Year Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Board Selection */}
              <div className="space-y-2">
                <Label>Board *</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={form.board_id}
                  onChange={(e) =>
                    setForm({ ...form, board_id: Number(e.target.value) })
                  }
                >
                  <option value="">Select a board</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name} {board.short_name && `(${board.short_name})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Input */}
              <div className="space-y-2">
                <Label>Year *</Label>
                <Input
                  type="text"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="e.g., 2024"
                />
              </div>
            </div>

            {/* Search and Selection Header */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Select Question</h3>
                  <p className="text-sm text-gray-600">
                    Current: Question ID {item.question_id} (shown first)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search questions..."
                      className="pl-9 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSearch}>
                    Search
                  </Button>
                </div>
              </div>

              {/* Questions List */}
              {loadingQuestions ? (
                <div className="text-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading questions...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-gray-600">
                    {searchTerm
                      ? `No questions found for "${searchTerm}"`
                      : "No questions available"}
                  </p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {questions.map((question) => {
                        const isSelected = selectedQuestions.includes(
                          question.id
                        );
                        const isCurrent = question.id === item.question_id;

                        return (
                          <div
                            key={question.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary border-2 bg-blue-50"
                                : isCurrent
                                ? "border-yellow-200 border-2 bg-yellow-50"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => toggleQuestion(question.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-primary" />
                                ) : isCurrent ? (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    Current
                                  </Badge>
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      ID: {question.id}
                                    </Badge>
                                    {question.is_published && (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-50"
                                      >
                                        Published
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="font-medium text-gray-800">
                                  {question.question}
                                </p>
                                {renderOptions(question)}
                                {question.answer && (
                                  <div className="mt-2 text-sm text-green-700">
                                    <span className="font-medium">Answer:</span>{" "}
                                    {question.answer}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={!pagination.hasPrev || loadingQuestions}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={!pagination.hasNext || loadingQuestions}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Current Selection Preview */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold mb-2">Current Selection:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Board:</p>
                  <p className="font-medium">
                    {boards.find((b) => b.id === form.board_id)?.name ||
                      "Not selected"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Year:</p>
                  <p className="font-medium">{form.year}</p>
                </div>
                <div>
                  <p className="text-gray-600">Question ID:</p>
                  <p className="font-medium">
                    {form.question_id || "Not selected"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Delete Mapping Modal
function DeleteMappingModal({
  id,
  onSuccess,
}: {
  id: number;
  onSuccess?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${BASE_URL}/api/board-questions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Mapping deleted successfully!");
        onSuccess?.();
        setIsOpen(false);
      } else {
        const error = await res.json();
        alert(`Delete failed: ${error.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed - check console for details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setIsOpen(true)}
      >
        <Trash className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              This will delete the board-question mapping permanently.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-center">
              Are you sure you want to delete mapping <strong>#{id}</strong>?
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Table Columns
export const boardQuestionColumns: ColumnDef<BoardQuestionItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm">#{row.original.id}</span>
    ),
  },
  {
    accessorKey: "board_name",
    header: "Board",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.board_name}</div>
        <div className="text-xs text-gray-500">ID: {row.original.board_id}</div>
      </div>
    ),
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-semibold">
        {row.original.year}
      </Badge>
    ),
  },
  {
    accessorKey: "question",
    header: "Question",
    cell: ({ row }) => {
      const questionText = row.original.question;
      const truncatedText =
        questionText.length > 60
          ? `${questionText.substring(0, 60)}...`
          : questionText;

      return (
        <div className="max-w-xs">
          <p className="font-medium" title={questionText}>
            {truncatedText}
          </p>
          {row.original.answer && (
            <p className="text-xs text-green-600 font-medium mt-1">
              Answer: {row.original.answer}
            </p>
          )}
          <div className="flex gap-1 mt-1">
            <Badge variant="outline" className="text-xs">
              {row.original.is_draft ? "Draft" : "Live"}
            </Badge>
            {row.original.is_published && (
              <Badge variant="outline" className="text-xs bg-green-50">
                Published
              </Badge>
            )}
          </div>
          {(row.original.subject_name || row.original.chapter_name) && (
            <div className="flex gap-2 mt-1 text-xs text-gray-500">
              {row.original.subject_name && (
                <span>S: {row.original.subject_name}</span>
              )}
              {row.original.chapter_name && (
                <span>C: {row.original.chapter_name}</span>
              )}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "question_id",
    header: "Question ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm">#{row.original.question_id}</span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex gap-1">
          <ViewMappingModal item={item} />
          <EditMappingModal item={item} />
          <DeleteMappingModal id={item.id} />
        </div>
      );
    },
  },
];
