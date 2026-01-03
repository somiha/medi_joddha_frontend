"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  RefreshCw,
  Save,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Separator } from "@/components/ui/separator";

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

interface Question {
  id: number;
  question: string;
  answer?: string;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  option4?: string | null;
  option5?: string | null;
  subject_id?: number;
  chapter_id?: number;
  is_draft?: boolean;
  is_published?: boolean;
}

interface Board {
  id: number;
  name: string;
  short_name?: string;
}

interface Subject {
  id: number;
  name: string;
}

interface Chapter {
  id: number;
  name: string;
  subject_id: number;
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

interface GroupUpdateRequest {
  boardId: number;
  year: string;
  subjectId?: number;
  chapterId?: number;
  updates: {
    board_id?: number;
    year?: string;
    subject_id?: number | null;
    chapter_id?: number | null;
    new_questions?: number[];
    remove_questions?: number[];
  };
}

export default function GroupEditModal({
  group,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: {
  group: GroupedQuestion;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("edit-group");
  const [formData, setFormData] = useState({
    board_id: group.board_id,
    year: group.year,
    subject_id: group.subject_id || null,
    chapter_id: group.chapter_id || null,
  });
  const [boards, setBoards] = useState<Board[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [questionsToRemove, setQuestionsToRemove] = useState<number[]>([]);
  const [currentGroupQuestions, setCurrentGroupQuestions] = useState<
    Question[]
  >([]);
  //   const [filters, setFilters] = useState({
  //     subject_id:
  //       group.subject_id === null || group.subject_id === undefined
  //         ? "all"
  //         : group.subject_id.toString(),
  //     chapter_id:
  //       group.chapter_id === null || group.chapter_id === undefined
  //         ? "all"
  //         : group.chapter_id.toString(),
  //     is_published: "true",
  //   });

  const [filters, setFilters] = useState({
    subject_id: group.subject_id == null ? "all" : String(group.subject_id),
    chapter_id: group.chapter_id == null ? "all" : String(group.chapter_id),
    is_published: "true",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (isOpen) {
      fetchBoards();
      fetchSubjects();
      fetchCurrentGroupQuestions();
      setActiveTab("edit-group");
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.subject_id) {
      fetchChapters(formData.subject_id);
    } else {
      setChapters([]);
      setFormData((prev) => ({ ...prev, chapter_id: null }));
    }
  }, [formData.subject_id]);

  useEffect(() => {
    if (filters.subject_id && filters.subject_id !== "all") {
      fetchChaptersForFilter(parseInt(filters.subject_id));
    } else {
      setChapters([]);
      setFilters((prev) => ({ ...prev, chapter_id: "all" }));
    }
  }, [filters.subject_id]);

  const fetchBoards = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${BASE_URL}/api/boards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBoards(data.boards || []);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${BASE_URL}/api/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchChapters = async (subjectId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${BASE_URL}/api/chapters?subject_id=${subjectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setChapters(data.chapters || []);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
  };

  const fetchChaptersForFilter = async (subjectId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${BASE_URL}/api/chapters?subject_id=${subjectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setChapters(data.chapters || []);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
  };

  const fetchCurrentGroupQuestions = async () => {
    try {
      const token = localStorage.getItem("authToken");

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
        const questions: Question[] = json.data.data.map(
          (item: {
            question_id: number;
            question_text: string;
            answer?: string;
            option1?: string | null;
            option2?: string | null;
            option3?: string | null;
            option4?: string | null;
            option5?: string | null;
            subject_id?: number;
            chapter_id?: number;
            is_published?: boolean;
          }) => ({
            id: item.question_id,
            question: item.question_text || "",
            answer: item.answer || "",
            option1: item.option1 || null,
            option2: item.option2 || null,
            option3: item.option3 || null,
            option4: item.option4 || null,
            option5: item.option5 || null,
            subject_id: item.subject_id,
            chapter_id: item.chapter_id,
            is_published: item.is_published,
          })
        );
        setCurrentGroupQuestions(questions);
      }
    } catch (error) {
      console.error("Error fetching group questions:", error);
    }
  };

  // Add these useEffects after your existing useEffects
  useEffect(() => {
    if (isOpen && activeTab === "add-questions") {
      // Fetch available questions when tab is activated
      fetchAvailableQuestions(1);
    }
  }, [activeTab, isOpen]);

  // Optional: Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "add-questions") {
        fetchAvailableQuestions(1);
      }
    }, 500); // 500ms delay for typing

    return () => clearTimeout(timer);
  }, [
    searchTerm,
    filters.subject_id,
    filters.chapter_id,
    filters.is_published,
  ]);

  // Also improve the fetchAvailableQuestions function to handle errors better
  const fetchAvailableQuestions = async (page: number = 1) => {
    try {
      setFetchingQuestions(true);
      const token = localStorage.getItem("authToken");

      // Clear previous results
      setAvailableQuestions([]);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      if (filters.subject_id && filters.subject_id !== "all") {
        params.append("subject_id", filters.subject_id);
      }
      if (filters.chapter_id && filters.chapter_id !== "all") {
        params.append("chapter_id", filters.chapter_id);
      }
      if (filters.is_published && filters.is_published !== "all") {
        params.append("is_published", filters.is_published);
      }

      console.log("Fetching questions with params:", params.toString());

      const response = await fetch(
        `${BASE_URL}/api/questions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiQuestionsResponse = await response.json();
      console.log("Questions data received:", data);

      // Filter out questions already in the current group
      const currentQuestionIds = new Set(
        currentGroupQuestions.map((q) => q.id)
      );
      const available = (data.questions || []).filter(
        (q: Question) => !currentQuestionIds.has(q.id)
      );

      console.log("Filtered available questions:", available.length);

      setAvailableQuestions(available);
      setTotalPages(data.pagination?.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching available questions:", error);
      onError("Failed to fetch available questions. Please try again.");
      setAvailableQuestions([]);
    } finally {
      setFetchingQuestions(false);
    }
  };

  const toggleQuestionSelection = (questionId: number) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const toggleQuestionRemoval = (questionId: number) => {
    setQuestionsToRemove((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleFormChange = (
    field: keyof typeof formData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateGroup = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      // Prepare update data
      const updateData: GroupUpdateRequest["updates"] = {};

      // Only include changed fields
      if (formData.board_id !== group.board_id) {
        updateData.board_id = formData.board_id;
      }
      if (formData.year !== group.year) {
        updateData.year = formData.year;
      }
      if (formData.subject_id !== (group.subject_id || null)) {
        updateData.subject_id = formData.subject_id;
      }
      if (formData.chapter_id !== (group.chapter_id || null)) {
        updateData.chapter_id = formData.chapter_id;
      }

      // Get questions to add (new selections not already in group)
      const currentQuestionIds = new Set(
        currentGroupQuestions.map((q) => q.id)
      );
      const newQuestions = selectedQuestions.filter(
        (id) => !currentQuestionIds.has(id) && !questionsToRemove.includes(id)
      );
      if (newQuestions.length > 0) {
        updateData.new_questions = newQuestions;
        console.log("Questions to add:", newQuestions);
      }

      // Get questions to remove
      if (questionsToRemove.length > 0) {
        updateData.remove_questions = questionsToRemove;
        console.log("Questions to remove:", questionsToRemove);
        console.log(
          "Current group questions:",
          currentGroupQuestions.map((q) => q.id)
        );
      }

      console.log("Update data being sent:", updateData);

      // If there are updates, send them
      if (Object.keys(updateData).length > 0) {
        const requestBody: GroupUpdateRequest = {
          boardId: group.board_id,
          year: group.year,
          ...(group.subject_id && { subjectId: group.subject_id }),
          ...(group.chapter_id && { chapterId: group.chapter_id }),
          updates: updateData,
        };

        console.log("Request body:", requestBody);

        const response = await fetch(
          `${BASE_URL}/api/board-questions/group/update`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        const responseText = await response.text();
        console.log("Response status:", response.status);
        console.log("Response text:", responseText);

        if (response.ok) {
          const result = JSON.parse(responseText);
          console.log("Parsed response:", result);
          onSuccess(`Updated successfully. ${result.affectedCount || 0} `);
          onClose();
        } else {
          const error = JSON.parse(responseText);
          console.error("Error response:", error);
          onError(error.error || "Failed to update");
        }
      } else {
        onSuccess("No changes to save");
        onClose();
      }
    } catch (error) {
      console.error("Error updating:", error);
      onError("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchQuestions = () => {
    fetchAvailableQuestions(1);
  };

  const renderQuestionOptions = (question: Question) => {
    const options = [
      { key: "A", value: question.option1 },
      { key: "B", value: question.option2 },
      { key: "C", value: question.option3 },
      { key: "D", value: question.option4 },
      { key: "E", value: question.option5 },
    ];

    const validOptions = options.filter(
      (opt) =>
        opt.value && typeof opt.value === "string" && opt.value.trim() !== ""
    );

    if (validOptions.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {validOptions.map((opt, index) => (
          <div key={index} className="flex items-start gap-2 text-sm">
            <Badge variant="outline" className="shrink-0 mt-0.5">
              {opt.key}
            </Badge>
            <span className="text-gray-600">{opt.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Calculate counts
  const questionsToAdd = selectedQuestions.filter(
    (id) => !currentGroupQuestions.some((q) => q.id === id)
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Edit: {group.board_name} - {group.year}
          </DialogTitle>
          <DialogDescription>
            Edit board questions properties and manage questions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3 p-3 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {group.count}
              </div>
              <div className="text-xs text-muted-foreground">Current</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {questionsToAdd}
              </div>
              <div className="text-xs text-muted-foreground">To Add</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {questionsToRemove.length}
              </div>
              <div className="text-xs text-muted-foreground">To Remove</div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="edit-group">Details</TabsTrigger>
              <TabsTrigger value="add-questions">Add Questions</TabsTrigger>
              <TabsTrigger value="remove-questions">
                Remove Questions
              </TabsTrigger>
            </TabsList>

            {/* Edit Group Tab - FIXED */}
            <TabsContent value="edit-group" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Edit</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="board">Board</Label>
                          <Select
                            value={formData.board_id.toString()}
                            onValueChange={(value) =>
                              handleFormChange("board_id", parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select board" />
                            </SelectTrigger>
                            <SelectContent>
                              {boards.map((board) => (
                                <SelectItem
                                  key={board.id}
                                  value={board.id.toString()}
                                >
                                  {board.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="year">Year</Label>
                          <Input
                            id="year"
                            value={formData.year}
                            onChange={(e) =>
                              handleFormChange("year", e.target.value)
                            }
                            placeholder="e.g., 2024"
                          />
                        </div>

                        {/* Subject Selection - FIXED */}
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject (Optional)</Label>
                          <Select
                            value={
                              formData.subject_id === null ||
                              formData.subject_id === undefined
                                ? "none"
                                : formData.subject_id.toString()
                            }
                            onValueChange={(value) =>
                              handleFormChange(
                                "subject_id",
                                value === "none" ? null : parseInt(value)
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {subjects.map((subject) => (
                                <SelectItem
                                  key={subject.id}
                                  value={subject.id.toString()}
                                >
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Chapter Selection - FIXED */}
                        <div className="space-y-2">
                          <Label htmlFor="chapter">Chapter (Optional)</Label>
                          <Select
                            value={
                              formData.chapter_id === null ||
                              formData.chapter_id === undefined
                                ? "none"
                                : formData.chapter_id.toString()
                            }
                            onValueChange={(value) =>
                              handleFormChange(
                                "chapter_id",
                                value === "none" ? null : parseInt(value)
                              )
                            }
                            disabled={!formData.subject_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select chapter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {chapters.map((chapter) => (
                                <SelectItem
                                  key={chapter.id}
                                  value={chapter.id.toString()}
                                >
                                  {chapter.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Current Info
                      </h3>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Board
                            </p>
                            <p className="font-bold">{group.board_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Year
                            </p>
                            <p className="font-bold">{group.year}</p>
                          </div>
                          {group.subject_name && (
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Subject
                              </p>
                              <p className="font-bold">{group.subject_name}</p>
                            </div>
                          )}
                          {group.chapter_name && (
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Chapter
                              </p>
                              <p className="font-bold">{group.chapter_name}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Questions
                              </p>
                              <p className="text-2xl font-bold">
                                {group.count}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {group.question_ids.length} Question IDs
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add Questions Tab - FIXED */}
            <TabsContent value="add-questions" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Search and Filters - FIXED */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">
                        Search Questions to Add
                      </h3>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search questions by text..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSearchQuestions()
                            }
                          />
                        </div>
                        <Button
                          onClick={() => handleSearchQuestions()}
                          disabled={fetchingQuestions}
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Subject Filter - FIXED */}
                        <div className="space-y-2">
                          <Label htmlFor="filter-subject">Subject</Label>
                          <Select
                            value={filters.subject_id || "all"}
                            onValueChange={(value) =>
                              setFilters((prev) => ({
                                ...prev,
                                subject_id: value,
                                chapter_id: "all",
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All subjects" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Subjects</SelectItem>
                              {subjects.map((subject) => (
                                <SelectItem
                                  key={subject.id}
                                  value={subject.id.toString()}
                                >
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Chapter Filter - FIXED */}
                        <div className="space-y-2">
                          <Label htmlFor="filter-chapter">Chapter</Label>
                          <Select
                            value={filters.chapter_id}
                            onValueChange={(value) =>
                              setFilters((prev) => ({
                                ...prev,
                                chapter_id: value === "" ? "all" : value,
                              }))
                            }
                            disabled={
                              !filters.subject_id ||
                              filters.subject_id === "all"
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All chapters" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Chapters</SelectItem>
                              {chapters
                                .filter((c) =>
                                  filters.subject_id &&
                                  filters.subject_id !== "all"
                                    ? c.subject_id.toString() ===
                                      filters.subject_id
                                    : true
                                )
                                .map((chapter) => (
                                  <SelectItem
                                    key={chapter.id}
                                    value={chapter.id.toString()}
                                  >
                                    {chapter.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Status Filter - FIXED */}
                        <div className="space-y-2">
                          <Label htmlFor="filter-status">Status</Label>
                          <Select
                            value={filters.is_published}
                            onValueChange={(value) =>
                              setFilters((prev) => ({
                                ...prev,
                                is_published: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Published</SelectItem>
                              <SelectItem value="false">Draft</SelectItem>
                              <SelectItem value="all">All</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Available Questions List */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Available Questions</h4>
                        <Badge variant="outline">
                          {availableQuestions.length} found
                        </Badge>
                      </div>

                      {fetchingQuestions ? (
                        <div className="text-center py-8">
                          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
                          <p className="mt-2 text-muted-foreground">
                            Loading questions...
                          </p>
                        </div>
                      ) : availableQuestions.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            No questions found. Try a different search.
                          </p>
                        </div>
                      ) : (
                        <>
                          <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-3">
                              {availableQuestions.map((question) => {
                                const isSelected = selectedQuestions.includes(
                                  question.id
                                );

                                return (
                                  <Card
                                    key={question.id}
                                    className={`cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-primary border-2 bg-primary/5"
                                        : "hover:bg-muted"
                                    }`}
                                    onClick={() =>
                                      toggleQuestionSelection(question.id)
                                    }
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                          {isSelected ? (
                                            <CheckSquare className="w-5 h-5 text-primary" />
                                          ) : (
                                            <Square className="w-5 h-5 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <Badge variant="outline">
                                                ID: {question.id}
                                              </Badge>
                                              {question.is_published ? (
                                                <Badge className="bg-green-100 text-green-800">
                                                  Published
                                                </Badge>
                                              ) : (
                                                <Badge variant="outline">
                                                  Draft
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          <p className="font-medium">
                                            {question.question}
                                          </p>
                                          {renderQuestionOptions(question)}
                                          {question.answer && (
                                            <div className="mt-2 text-sm text-green-700">
                                              <span className="font-medium">
                                                Answer:
                                              </span>{" "}
                                              {question.answer}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </ScrollArea>

                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchAvailableQuestions(1)}
                                disabled={currentPage === 1}
                              >
                                First
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  fetchAvailableQuestions(currentPage - 1)
                                }
                                disabled={currentPage === 1}
                              >
                                Previous
                              </Button>
                              <span className="text-sm">
                                Page {currentPage} of {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  fetchAvailableQuestions(currentPage + 1)
                                }
                                disabled={currentPage === totalPages}
                              >
                                Next
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  fetchAvailableQuestions(totalPages)
                                }
                                disabled={currentPage === totalPages}
                              >
                                Last
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Selected Questions Preview */}
                    {selectedQuestions.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <h5 className="font-semibold text-green-800">
                              Selected for Addition
                            </h5>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            {selectedQuestions.length} selected
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedQuestions.map((id) => (
                            <Badge
                              key={id}
                              variant="outline"
                              className="bg-white"
                            >
                              Q#{id}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Remove Questions Tab - Already correct */}
            <TabsContent value="remove-questions" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Current Questions
                      </h3>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                          Select questions to remove from this
                        </p>
                        <Badge variant="outline">
                          {currentGroupQuestions.length} questions
                        </Badge>
                      </div>
                    </div>

                    {currentGroupQuestions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No questions</p>
                      </div>
                    ) : (
                      <>
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-3">
                            {currentGroupQuestions.map((question) => {
                              const isMarkedForRemoval =
                                questionsToRemove.includes(question.id);

                              return (
                                <Card
                                  key={question.id}
                                  className={`cursor-pointer transition-all ${
                                    isMarkedForRemoval
                                      ? "border-red-200 border-2 bg-red-50"
                                      : "hover:bg-muted"
                                  }`}
                                  onClick={() =>
                                    toggleQuestionRemoval(question.id)
                                  }
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="mt-1">
                                        {isMarkedForRemoval ? (
                                          <div className="w-5 h-5 flex items-center justify-center bg-red-100 rounded">
                                            <X className="w-4 h-4 text-red-600" />
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 border border-muted-foreground/30 rounded flex items-center justify-center">
                                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                              ID: {question.id}
                                            </Badge>
                                          </div>
                                          {isMarkedForRemoval && (
                                            <Badge className="bg-red-100 text-red-800">
                                              Will be removed
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="font-medium">
                                          {question.question}
                                        </p>
                                        {renderQuestionOptions(question)}
                                        {question.answer && (
                                          <div className="mt-2 text-sm text-green-700">
                                            <span className="font-medium">
                                              Answer:
                                            </span>{" "}
                                            {question.answer}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </ScrollArea>

                        {/* Questions to Remove Preview */}
                        {questionsToRemove.length > 0 && (
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <h5 className="font-semibold text-red-800">
                                  Marked for Removal
                                </h5>
                              </div>
                              <Badge className="bg-red-100 text-red-800">
                                {questionsToRemove.length} selected
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {questionsToRemove.map((id) => (
                                <Badge
                                  key={id}
                                  variant="outline"
                                  className="bg-white"
                                >
                                  Q#{id}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdateGroup} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
