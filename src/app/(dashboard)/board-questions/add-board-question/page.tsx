"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ChevronLeft,
  Upload,
  BookOpen,
  Search,
  CheckSquare,
  Square,
  Building,
  Filter,
  X,
  RefreshCw,
  Book,
  Layers,
  BookMarked,
  School,
  CheckCircle,
  Trash2,
} from "lucide-react";

const BASE_URL = "https://medijoddha.save71.net";

interface Board {
  id: number;
  name: string;
  short_name?: string;
}

interface Subject {
  id: number;
  name: string;
  code?: string;
}

interface Chapter {
  id: number;
  name: string;
  subject_id: number;
  chapter_number?: number;
}

interface Topic {
  id: number;
  name: string;
  chapter_id: number;
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
  subject_id?: number;
  chapter_id?: number;
  topic_id?: number;
  is_draft?: boolean;
  is_published?: boolean;
  subject?: Subject;
  chapter?: Chapter;
  topic?: Topic;
}

interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  questions: Question[];
  pagination: Pagination;
}

export default function AddBulkBoardQuestionsPage() {
  const router = useRouter();

  // Form state
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [year, setYear] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);

  // Data state
  const [boards, setBoards] = useState<Board[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    subject_id: "all",
    chapter_id: "all",
    topic_id: "all",
    is_published: "true",
    is_draft: "all",
  });

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    hasNext: false,
    hasPrev: false,
  });

  // UI state
  const [loading, setLoading] = useState({
    boards: true,
    subjects: true,
    chapters: false,
    topics: false,
    questions: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage] = useState(10);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        // Fetch boards
        const boardsRes = await fetch(`${BASE_URL}/api/boards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (boardsRes.ok) {
          const boardsResult = await boardsRes.json();
          setBoards(boardsResult.boards || []);
        }

        // Fetch subjects
        const subjectsRes = await fetch(`${BASE_URL}/api/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (subjectsRes.ok) {
          const subjectsResult = await subjectsRes.json();
          setSubjects(subjectsResult.subjects || []);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading((prev) => ({ ...prev, boards: false, subjects: false }));
      }
    };

    fetchInitialData();
  }, []);

  // Fetch chapters when subject is selected - FIXED
  useEffect(() => {
    const fetchChapters = async () => {
      if (!filters.subject_id || filters.subject_id === "all") {
        setChapters([]);
        setFilters((prev) => ({ ...prev, chapter_id: "all", topic_id: "all" }));
        setTopics([]);
        return;
      }

      try {
        setLoading((prev) => ({ ...prev, chapters: true }));
        const token = localStorage.getItem("authToken");

        // Try multiple API endpoints to find the correct one
        const endpoints = [
          `${BASE_URL}/api/chapters/subject/${filters.subject_id}`,
          `${BASE_URL}/api/chapters?subject_id=${filters.subject_id}`,
          `${BASE_URL}/api/subjects/${filters.subject_id}/chapters`,
        ];

        let chaptersData: Chapter[] = [];

        for (const endpoint of endpoints) {
          try {
            console.log("Trying endpoint:", endpoint);
            const res = await fetch(endpoint, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
              const data = await res.json();
              console.log("Chapters API response from", endpoint, ":", data);

              // Handle different response formats
              if (Array.isArray(data)) {
                chaptersData = data;
              } else if (data.chapters && Array.isArray(data.chapters)) {
                chaptersData = data.chapters;
              } else if (data.data && Array.isArray(data.data)) {
                chaptersData = data.data;
              }

              if (chaptersData.length > 0) {
                console.log("Found chapters:", chaptersData);
                break;
              }
            }
          } catch (error) {
            console.log("Failed with endpoint", endpoint, ":", error);
          }
        }

        setChapters(chaptersData);

        if (chaptersData.length === 0) {
          console.log("No chapters found for subject ID:", filters.subject_id);
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
        setChapters([]);
      } finally {
        setLoading((prev) => ({ ...prev, chapters: false }));
      }
    };

    fetchChapters();
  }, [filters.subject_id]);

  // Fetch topics when chapter is selected - FIXED
  useEffect(() => {
    const fetchTopics = async () => {
      if (!filters.chapter_id || filters.chapter_id === "all") {
        setTopics([]);
        setFilters((prev) => ({ ...prev, topic_id: "all" }));
        return;
      }

      try {
        setLoading((prev) => ({ ...prev, topics: true }));
        const token = localStorage.getItem("authToken");

        // Try multiple API endpoints
        const endpoints = [
          `${BASE_URL}/api/topics/chapter/${filters.chapter_id}`,
          `${BASE_URL}/api/topics?chapter_id=${filters.chapter_id}`,
          `${BASE_URL}/api/chapters/${filters.chapter_id}/topics`,
        ];

        let topicsData: Topic[] = [];

        for (const endpoint of endpoints) {
          try {
            console.log("Trying topics endpoint:", endpoint);
            const res = await fetch(endpoint, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
              const data = await res.json();
              console.log("Topics API response from", endpoint, ":", data);

              if (Array.isArray(data)) {
                topicsData = data;
              } else if (data.topics && Array.isArray(data.topics)) {
                topicsData = data.topics;
              } else if (data.data && Array.isArray(data.data)) {
                topicsData = data.data;
              }

              if (topicsData.length > 0) {
                console.log("Found topics:", topicsData);
                break;
              }
            }
          } catch (error) {
            console.log("Failed with endpoint", endpoint, ":", error);
          }
        }

        setTopics(topicsData);

        if (topicsData.length === 0) {
          console.log("No topics found for chapter ID:", filters.chapter_id);
        }
      } catch (error) {
        console.error("Error fetching topics:", error);
        setTopics([]);
      } finally {
        setLoading((prev) => ({ ...prev, topics: false }));
      }
    };

    fetchTopics();
  }, [filters.chapter_id]);

  // Fetch questions with filters and pagination
  const fetchQuestions = useCallback(
    async (page: number = 1) => {
      try {
        setLoading((prev) => ({ ...prev, questions: true }));
        const token = localStorage.getItem("authToken");

        if (!token) {
          console.error("No auth token found");
          return;
        }

        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: itemsPerPage.toString(),
        });

        // Add filters to params - filter out "all" values
        if (searchTerm) {
          params.append("search", searchTerm);
        }
        if (filters.subject_id && filters.subject_id !== "all") {
          params.append("subject_id", filters.subject_id);
        }
        if (filters.chapter_id && filters.chapter_id !== "all") {
          params.append("chapter_id", filters.chapter_id);
        }
        if (filters.topic_id && filters.topic_id !== "all") {
          params.append("topic_id", filters.topic_id);
        }
        if (filters.is_published && filters.is_published !== "all") {
          params.append("is_published", filters.is_published);
        }
        if (filters.is_draft && filters.is_draft !== "all") {
          params.append("is_draft", filters.is_draft);
        }

        console.log("Fetching questions with params:", params.toString());

        const res = await fetch(`${BASE_URL}/api/questions?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: ApiResponse = await res.json();
        console.log("Questions API response:", data);

        setQuestions(data.questions || []);
        setPagination(
          data.pagination || {
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
            hasNext: false,
            hasPrev: false,
          }
        );
      } catch (error) {
        console.error("Error fetching questions:", error);
        alert("Failed to load questions. Please try again.");
        setQuestions([]);
        setPagination({
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        });
      } finally {
        setLoading((prev) => ({ ...prev, questions: false }));
      }
    },
    [filters, itemsPerPage, searchTerm]
  );

  // Fetch questions when filters change
  useEffect(() => {
    fetchQuestions(1);
  }, [fetchQuestions]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    console.log(`Filter change: ${key} = ${value}`);
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // Reset dependent filters
      if (key === "subject_id") {
        newFilters.chapter_id = "all";
        newFilters.topic_id = "all";
        setChapters([]);
        setTopics([]);
      } else if (key === "chapter_id") {
        newFilters.topic_id = "all";
        setTopics([]);
      }

      return newFilters;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      search: "",
      subject_id: "all",
      chapter_id: "all",
      topic_id: "all",
      is_published: "true",
      is_draft: "all",
    });
    setChapters([]);
    setTopics([]);
  };

  // Handle question selection
  const toggleQuestion = (questionId: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Handle select all on current page
  const toggleSelectAll = () => {
    const currentPageQuestionIds = questions.map((q) => q.id);
    const allSelected = currentPageQuestionIds.every((id) =>
      selectedQuestions.includes(id)
    );

    if (allSelected) {
      // Deselect all on current page
      setSelectedQuestions((prev) =>
        prev.filter((id) => !currentPageQuestionIds.includes(id))
      );
    } else {
      // Select all on current page
      setSelectedQuestions((prev) => {
        const newSelection = [...prev];
        currentPageQuestionIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedBoard) {
      alert("Please select a board");
      return;
    }

    if (!year.trim()) {
      alert("Please enter a year");
      return;
    }

    if (selectedQuestions.length === 0) {
      alert("Please select at least one question");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const payload = {
        board_id: selectedBoard.id,
        question_id: selectedQuestions,
        years: year,
      };

      console.log("Submitting payload:", payload);

      const res = await fetch(`${BASE_URL}/api/board-questions/bulk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("Bulk create response:", result);

      if (res.ok) {
        alert(
          `Successfully created ${result.count || selectedQuestions.length} !`
        );
        router.push("/board-questions");
      } else {
        alert(`Error: ${result.error || "Failed to create"}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchQuestions(page);
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchQuestions(1);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    fetchQuestions(1);
  };

  // Render question options
  const renderOptions = (question: Question) => {
    const options = [
      { key: "option1", value: question.option1 },
      { key: "option2", value: question.option2 },
      { key: "option3", value: question.option3 },
      { key: "option4", value: question.option4 },
      { key: "option5", value: question.option5 },
    ].filter((opt) => opt.value && opt.value.trim() !== "");

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

  // Get selected subject name
  const getSelectedSubjectName = () => {
    if (!filters.subject_id || filters.subject_id === "all") return "";
    const subject = subjects.find(
      (s) => s.id.toString() === filters.subject_id
    );
    return subject?.name || "";
  };

  // Get selected chapter name
  const getSelectedChapterName = () => {
    if (!filters.chapter_id || filters.chapter_id === "all") return "";
    const chapter = chapters.find(
      (c) => c.id.toString() === filters.chapter_id
    );
    return chapter?.name || "";
  };

  // Get selected topic name
  const getSelectedTopicName = () => {
    if (!filters.topic_id || filters.topic_id === "all") return "";
    const topic = topics.find((t) => t.id.toString() === filters.topic_id);
    return topic?.name || "";
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      Object.entries(filters).some(
        ([key, value]) =>
          (key !== "is_published" &&
            key !== "is_draft" &&
            value !== "" &&
            value !== "all") ||
          (key === "search" && value !== "")
      ) || searchTerm !== ""
    );
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedQuestions([]);
  };

  // Reset everything
  const resetAll = () => {
    setSelectedBoard(null);
    setYear("");
    setSelectedQuestions([]);
    clearFilters();
  };

  // Log state changes for debugging
  useEffect(() => {
    console.log("Current filters:", filters);
    console.log("Chapters state:", chapters);
    console.log("Topics state:", topics);
    console.log("Loading state:", loading);
  }, [filters, chapters, topics, loading]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/board-questions")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add Bulk Board Questions</h1>
            <p className="text-gray-600 mt-1">
              Select a board, enter year, and choose questions to create
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Board & Year Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Board & Year
              </CardTitle>
              <CardDescription>
                Select board and enter examination year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Board Selection */}
              <div className="space-y-2">
                <Label htmlFor="board">Select Board *</Label>
                {loading.boards ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={selectedBoard?.id?.toString() || ""}
                    onValueChange={(value) => {
                      const boardId = parseInt(value);
                      const board =
                        boards.find((b) => b.id === boardId) || null;
                      setSelectedBoard(board);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- Select Board --" />
                    </SelectTrigger>
                    <SelectContent>
                      {boards.map((board) => (
                        <SelectItem key={board.id} value={board.id.toString()}>
                          {board.name}{" "}
                          {board.short_name && `(${board.short_name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedBoard && (
                  <div className="p-4 bg-blue-50 rounded-md border border-blue-100 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{selectedBoard.name}</p>
                        {selectedBoard.short_name && (
                          <p className="text-sm text-gray-600">
                            Short: {selectedBoard.short_name}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">ID: {selectedBoard.id}</Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Year Input */}
              <div className="space-y-2">
                <Label htmlFor="year">Examination Year *</Label>
                <Input
                  id="year"
                  type="text"
                  placeholder="e.g., 2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-gray-500">
                  Enter the year when the examination was held
                </p>
              </div>

              {/* Selection Summary */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Selection Summary</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Board:</span>
                      <span className="font-medium">
                        {selectedBoard ? selectedBoard.name : "Not selected"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">
                        {year || "Not entered"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Questions Selected:</span>
                      <Badge
                        variant={
                          selectedQuestions.length > 0 ? "default" : "outline"
                        }
                      >
                        {selectedQuestions.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Filters Active:</span>
                      <Badge
                        variant={hasActiveFilters() ? "default" : "outline"}
                      >
                        {hasActiveFilters() ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !selectedBoard ||
                  !year ||
                  selectedQuestions.length === 0
                }
                className="w-full text-white hover:opacity-90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating ...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Create {selectedQuestions.length}
                    {selectedQuestions.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={resetAll} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Middle Panel - Filters */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Questions
              </CardTitle>
              <CardDescription>
                Filter by subject, chapter, topic, and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search questions..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <Label htmlFor="subject">
                  <div className="flex items-center gap-2">
                    <Book className="w-4 h-4" />
                    Subject
                  </div>
                </Label>
                {loading.subjects ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={filters.subject_id}
                    onValueChange={(value) =>
                      handleFilterChange("subject_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.id.toString()}
                        >
                          {subject.name} {subject.code && `(${subject.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filters.subject_id !== "all" && (
                  <div className="text-xs text-green-600">
                    Selected: {getSelectedSubjectName()}
                  </div>
                )}
              </div>

              {/* Chapter Filter */}
              <div className="space-y-2">
                <Label htmlFor="chapter">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Chapter
                  </div>
                </Label>
                {loading.chapters ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={filters.chapter_id}
                    onValueChange={(value) =>
                      handleFilterChange("chapter_id", value)
                    }
                    disabled={
                      !filters.subject_id || filters.subject_id === "all"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          filters.subject_id === "all"
                            ? "Select subject first"
                            : chapters.length === 0
                            ? "No chapters found"
                            : "All Chapters"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chapters</SelectItem>
                      {chapters.map((chapter) => (
                        <SelectItem
                          key={chapter.id}
                          value={chapter.id.toString()}
                        >
                          {chapter.chapter_number &&
                            `Ch. ${chapter.chapter_number}: `}
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filters.chapter_id !== "all" &&
                  filters.subject_id !== "all" &&
                  chapters.length > 0 && (
                    <div className="text-xs text-green-600">
                      Selected: {getSelectedChapterName()} ({chapters.length}{" "}
                      available)
                    </div>
                  )}
                {filters.subject_id !== "all" &&
                  chapters.length === 0 &&
                  !loading.chapters && (
                    <div className="text-xs text-yellow-600">
                      No chapters found for this subject
                    </div>
                  )}
              </div>

              {/* Topic Filter */}
              <div className="space-y-2">
                <Label htmlFor="topic">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4" />
                    Topic
                  </div>
                </Label>
                {loading.topics ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={filters.topic_id}
                    onValueChange={(value) =>
                      handleFilterChange("topic_id", value)
                    }
                    disabled={
                      !filters.chapter_id || filters.chapter_id === "all"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          filters.chapter_id === "all"
                            ? "Select chapter first"
                            : topics.length === 0
                            ? "No topics found"
                            : "All Topics"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filters.topic_id !== "all" &&
                  filters.chapter_id !== "all" &&
                  topics.length > 0 && (
                    <div className="text-xs text-green-600">
                      Selected: {getSelectedTopicName()} ({topics.length}{" "}
                      available)
                    </div>
                  )}
                {filters.chapter_id !== "all" &&
                  topics.length === 0 &&
                  !loading.topics && (
                    <div className="text-xs text-yellow-600">
                      No topics found for this chapter
                    </div>
                  )}
              </div>

              {/* Status Filters */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Publication Status</Label>
                  <Select
                    value={filters.is_published}
                    onValueChange={(value) =>
                      handleFilterChange("is_published", value)
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

                <div className="space-y-2">
                  <Label>Draft Status</Label>
                  <Select
                    value={filters.is_draft}
                    onValueChange={(value) =>
                      handleFilterChange("is_draft", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Draft Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Draft</SelectItem>
                      <SelectItem value="false">Not Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters() && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 text-blue-800">
                      Active Filters
                    </h4>
                    <div className="space-y-2 text-sm">
                      {searchTerm && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Search:</span>
                          <Badge variant="outline">{searchTerm}</Badge>
                        </div>
                      )}
                      {filters.subject_id && filters.subject_id !== "all" && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Subject:</span>
                          <Badge variant="outline">
                            {getSelectedSubjectName()}
                          </Badge>
                        </div>
                      )}
                      {filters.chapter_id && filters.chapter_id !== "all" && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Chapter:</span>
                          <Badge variant="outline">
                            {getSelectedChapterName()}
                          </Badge>
                        </div>
                      )}
                      {filters.topic_id && filters.topic_id !== "all" && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Topic:</span>
                          <Badge variant="outline">
                            {getSelectedTopicName()}
                          </Badge>
                        </div>
                      )}
                      {filters.is_published !== "all" && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Status:</span>
                          <Badge variant="outline">
                            {filters.is_published === "true"
                              ? "Published"
                              : "Draft"}
                          </Badge>
                        </div>
                      )}
                      {filters.is_draft !== "all" && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Draft:</span>
                          <Badge variant="outline">
                            {filters.is_draft === "true" ? "Yes" : "No"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filter Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters()}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fetchQuestions(1)}
                  className="w-full"
                  disabled={loading.questions}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Question Selection */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Select Questions
                  </CardTitle>
                  <CardDescription>
                    {pagination.totalItems > 0 ? (
                      <>
                        Showing {questions.length} of {pagination.totalItems}{" "}
                        questions
                        {hasActiveFilters() && " (filtered)"}
                      </>
                    ) : (
                      "Choose questions to map with the selected board"
                    )}
                  </CardDescription>
                </div>
                <div className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Selection Actions */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={
                        questions.length > 0 &&
                        questions.every((q) => selectedQuestions.includes(q.id))
                      }
                      onCheckedChange={toggleSelectAll}
                      disabled={questions.length === 0}
                    />
                    <Label htmlFor="select-all" className="font-medium">
                      Select All on Page
                    </Label>
                  </div>
                  <Badge variant="secondary">
                    {selectedQuestions.length} selected
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllSelections}
                  disabled={selectedQuestions.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Selected
                </Button>
              </div>

              {/* Questions List */}
              {loading.questions ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-gray-600">Loading questions...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center p-12">
                  <div className="text-gray-400 text-5xl mb-4">❓</div>
                  <h3 className="text-lg font-semibold mb-2">
                    No Questions Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {hasActiveFilters()
                      ? "No questions match your filters. Try adjusting your criteria."
                      : "No questions available. Please check if questions exist in the system."}
                  </p>
                  {hasActiveFilters() && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => fetchQuestions(1)}
                    className="ml-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {questions.map((question) => {
                        const isSelected = selectedQuestions.includes(
                          question.id
                        );
                        return (
                          <Card
                            key={question.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              isSelected
                                ? "border-primary border-2 bg-blue-50"
                                : ""
                            }`}
                            onClick={() => toggleQuestion(question.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-primary" />
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
                                      {question.subject && (
                                        <Badge
                                          variant="outline"
                                          className="bg-purple-50 text-purple-700"
                                        >
                                          <School className="w-3 h-3 mr-1" />
                                          {question.subject.name}
                                        </Badge>
                                      )}
                                      {question.chapter && (
                                        <Badge
                                          variant="outline"
                                          className="bg-indigo-50 text-indigo-700"
                                        >
                                          <Layers className="w-3 h-3 mr-1" />
                                          {question.chapter.name}
                                        </Badge>
                                      )}
                                      {question.is_published && (
                                        <Badge
                                          variant="outline"
                                          className="bg-green-50 text-green-700"
                                        >
                                          Published
                                        </Badge>
                                      )}
                                      {question.is_draft && (
                                        <Badge
                                          variant="outline"
                                          className="bg-yellow-50 text-yellow-700"
                                        >
                                          Draft
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Question Text */}
                                  <p className="font-medium text-gray-800 mb-2">
                                    {question.question ||
                                      "No question text available"}
                                  </p>

                                  {/* Options */}
                                  {renderOptions(question)}

                                  {/* Answer */}
                                  {question.answer &&
                                    question.answer.trim() && (
                                      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                        <p className="text-sm font-medium text-green-800">
                                          Answer:
                                        </p>
                                        <p className="text-green-900">
                                          {question.answer}
                                        </p>
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
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={!pagination.hasPrev}
                      >
                        Previous
                      </Button>
                      <span className="text-sm px-3">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={!pagination.hasNext}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={
                          pagination.currentPage === pagination.totalPages
                        }
                      >
                        Last
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Selected Questions Summary */}
              {selectedQuestions.length > 0 && (
                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <h5 className="font-semibold text-green-800">
                        Selected Questions Summary
                      </h5>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {selectedQuestions.length} selected
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedQuestions.slice(0, 10).map((id) => (
                      <Badge key={id} variant="outline" className="bg-white">
                        Q#{id}
                      </Badge>
                    ))}
                    {selectedQuestions.length > 10 && (
                      <Badge variant="outline" className="bg-white">
                        +{selectedQuestions.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
