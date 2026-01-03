"use client";

import { useEffect, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Pencil,
  Eye,
  FileText,
  Plus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import GroupEditModal from "./GroupEditModal";
import GroupViewModal from "./GroupViewModal";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ✅ FIXED: Remove trailing spaces in URL
const BASE_URL = "https://medijoddha.save71.net";

// Interfaces remain unchanged (correctly defined)
interface ApiBoardQuestionDetail {
  id: number;
  board_id: number;
  board_name: string;
  question_id: number;
  year: string;
  question_text: string;
  answer?: string;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  option4?: string | null;
  option5?: string | null;
  subject_id?: number;
  subject_name?: string;
  chapter_id?: number;
  chapter_name?: string;
  is_draft?: boolean;
  is_published?: boolean;
}

interface BoardQuestionItem {
  id: number;
  board_id: number;
  question_id: number;
  year: string;
  board_name: string;
  question: string;
  answer?: string;
  question_options?: {
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
    option4?: string | null;
    option5?: string | null;
  };
  is_draft: boolean;
  is_published: boolean;
  subject_id?: number;
  chapter_id?: number;
  subject_name?: string;
  chapter_name?: string;
  group_key?: string;
}

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
  questions: BoardQuestionItem[];
  count: number;
}

export default function BoardQuestionsPage() {
  const [groupedQuestions, setGroupedQuestions] = useState<GroupedQuestion[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<GroupedQuestion | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // ✅ FIXED: Removed pagination parameter since we fetch all data
  const fetchBoardQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${BASE_URL}/api/board-questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      const json = await res.json();

      let itemsData: ApiBoardQuestionDetail[] = [];
      // Handle multiple possible response structures
      if (json.success && json.data && Array.isArray(json.data.data)) {
        itemsData = json.data.data;
      } else if (Array.isArray(json.data)) {
        itemsData = json.data;
      } else if (Array.isArray(json)) {
        itemsData = json;
      } else {
        throw new Error("Unexpected response structure");
      }

      const items: BoardQuestionItem[] = itemsData.map((item) => ({
        id: item.id,
        board_id: item.board_id,
        question_id: item.question_id,
        year: item.year,
        board_name: item.board_name || `Board ${item.board_id}`,
        question: item.question_text || `Question ${item.question_id}`,
        answer: item.answer || "",
        question_options: {
          option1: item.option1 || null,
          option2: item.option2 || null,
          option3: item.option3 || null,
          option4: item.option4 || null,
          option5: item.option5 || null,
        },
        is_draft: item.is_draft || false,
        is_published: item.is_published || false,
        subject_id: item.subject_id,
        chapter_id: item.chapter_id,
        subject_name: item.subject_name,
        chapter_name: item.chapter_name,
        group_key: `${item.board_id}-${item.year}-${item.subject_id || "null"}`,
      }));

      const grouped = groupQuestionsByCategory(items);
      setGroupedQuestions(grouped);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const groupQuestionsByCategory = (
    items: BoardQuestionItem[]
  ): GroupedQuestion[] => {
    const map: Record<string, GroupedQuestion> = {};
    items.forEach((item) => {
      const key = item.group_key!;
      if (!map[key]) {
        map[key] = {
          key,
          board_id: item.board_id,
          board_name: item.board_name,
          year: item.year,
          subject_id: item.subject_id,
          subject_name: item.subject_name,
          chapter_id: item.chapter_id,
          chapter_name: item.chapter_name,
          question_ids: [],
          questions: [],
          count: 0,
        };
      }
      // Avoid duplicate question IDs in the same group
      if (!map[key].question_ids.includes(item.question_id)) {
        map[key].question_ids.push(item.question_id);
      }
      map[key].questions.push(item);
      map[key].count = map[key].question_ids.length;
    });
    return Object.values(map);
  };

  useEffect(() => {
    fetchBoardQuestions();
  }, [fetchBoardQuestions]);

  const handleEditGroup = (group: GroupedQuestion) => {
    setSelectedGroup(group);
    setShowEditModal(true);
  };

  const handleViewGroup = (group: GroupedQuestion) => {
    setSelectedGroup(group);
    setShowViewModal(true);
  };

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
    fetchBoardQuestions();
    setShowEditModal(false);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Board Question</h1>
        </div>
        <div className="flex gap-2">
          {/* <Button
            variant="outline"
            onClick={fetchBoardQuestions}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button> */}
          <Link href="/board-questions/add-board-question">
            <Button className="gap-2">
              <FileText className="w-4 h-4" />
              Add Bulk
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading ...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error: {error}</p>
            <Button
              variant="outline"
              onClick={fetchBoardQuestions} // ✅ FIXED: No parameter
              className="mt-2"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : groupedQuestions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="font-semibold mb-2">No board question found</h3>

            <Link href="/board-questions/add-board-question">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Question ({groupedQuestions.length})
            </CardTitle>
            <p className="text-sm text-gray-600">
              Showing {groupedQuestions.length} board questions with{" "}
              {groupedQuestions.reduce((sum, group) => sum + group.count, 0)}{" "}
              unique questions
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedQuestions.map((group) => (
                <Card
                  key={group.key}
                  className="border-l-4 border-l-primary hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      {/* Group Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="font-bold text-lg">
                            {group.board_name}
                          </span>
                          <Badge className="bg-primary text-white">
                            {group.year}
                          </Badge>
                          {group.subject_name && (
                            <Badge variant="outline" className="bg-blue-50">
                              {group.subject_name}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-500">Board ID</p>
                            <p className="font-mono">{group.board_id}</p>
                          </div>
                          {group.subject_id && (
                            <div>
                              <p className="text-gray-500">Subject ID</p>
                              <p className="font-mono">{group.subject_id}</p>
                            </div>
                          )}
                        </div>

                        {/* Question IDs Preview */}
                        {group.question_ids.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-500 mb-2">
                              Question IDs:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {group.question_ids.slice(0, 8).map((id) => (
                                <Badge
                                  key={id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  #{id}
                                </Badge>
                              ))}
                              {group.question_ids.length > 8 && (
                                <Badge variant="outline" className="text-xs">
                                  +{group.question_ids.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewGroup(group)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                          className="gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {selectedGroup && showEditModal && (
        <GroupEditModal
          group={selectedGroup}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}

      {selectedGroup && showViewModal && (
        <GroupViewModal
          group={selectedGroup}
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
}
