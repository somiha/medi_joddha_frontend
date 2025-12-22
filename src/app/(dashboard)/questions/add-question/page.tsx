// app/questions/add-question/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, CheckCircle, XCircle, Info } from "lucide-react";

const BASE_URL = "https://medijoddha.save71.net";

interface Option {
  id: number;
  name: string;
}

interface BulkUploadError {
  row: number;
  error: string;
  data: Record<string, unknown>;
}

interface BulkUploadSummary {
  total: number;
  success: number;
  failed: number;
  successRate: string;
}

interface BulkUploadResult {
  success: boolean;
  message: string;
  summary?: BulkUploadSummary;
  errors?: BulkUploadError[];
  hasMoreErrors?: boolean;
}

interface OptionConfig {
  value: string;
  setValue: (value: string) => void;
  preview: string | null;
  setPreview: (preview: string | null) => void;
  ref: React.RefObject<HTMLInputElement | null>;
}

export default function AddQuestionPage() {
  // Single question form state
  const [subjectId, setSubjectId] = useState<string>("");
  const [chapterId, setChapterId] = useState<string>("");
  const [topicId, setTopicId] = useState<string>("");
  const [bookRefId, setBookRefId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [des, setDes] = useState("");
  const [isPublished, setIsPublished] = useState(true); // default: published

  // Only 4 options (A–D)
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");

  // Image previews
  const [questionImagePreview, setQuestionImagePreview] = useState<
    string | null
  >(null);
  const [answerImagePreview, setAnswerImagePreview] = useState<string | null>(
    null
  );
  const [desImagePreview, setDesImagePreview] = useState<string | null>(null);
  const [option1ImagePreview, setOption1ImagePreview] = useState<string | null>(
    null
  );
  const [option2ImagePreview, setOption2ImagePreview] = useState<string | null>(
    null
  );
  const [option3ImagePreview, setOption3ImagePreview] = useState<string | null>(
    null
  );
  const [option4ImagePreview, setOption4ImagePreview] = useState<string | null>(
    null
  );

  // Text paste
  const [pastedText, setPastedText] = useState("");

  // File refs
  const questionImageRef = useRef<HTMLInputElement | null>(null);
  const answerImageRef = useRef<HTMLInputElement | null>(null);
  const desImageRef = useRef<HTMLInputElement | null>(null);
  const option1ImageRef = useRef<HTMLInputElement | null>(null);
  const option2ImageRef = useRef<HTMLInputElement | null>(null);
  const option3ImageRef = useRef<HTMLInputElement | null>(null);
  const option4ImageRef = useRef<HTMLInputElement | null>(null);

  // Bulk upload
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Dropdown options
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [chapters, setChapters] = useState<Option[]>([]);
  const [topics, setTopics] = useState<Option[]>([]);
  const [bookRefs, setBookRefs] = useState<Option[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      if (!token) return;

      try {
        const res = await fetch(`${BASE_URL}/api/subjects?page=1&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSubjects(data.subjects || []);
      } catch (err) {
        console.error("Failed to fetch subjects", err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch chapters
  useEffect(() => {
    if (!subjectId) {
      setChapters([]);
      setChapterId("");
      return;
    }
    const fetchChapters = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/chapters?page=1&limit=200&subject_id=${subjectId}`
        );
        const data = await res.json();
        setChapters(data.chapters || []);
      } catch (err) {
        console.error("Failed to fetch chapters", err);
      }
    };
    fetchChapters();
  }, [subjectId]);

  // Fetch topics
  useEffect(() => {
    if (!chapterId) {
      setTopics([]);
      setTopicId("");
      return;
    }
    const fetchTopics = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/topics?chapter_id=${chapterId}&page=1&limit=200`
        );
        const data = await res.json();
        setTopics(data.topics || []);
      } catch (err) {
        console.error("Failed to fetch topics", err);
      }
    };
    fetchTopics();
  }, [chapterId]);

  // Fetch book refs
  useEffect(() => {
    if (!subjectId) {
      setBookRefs([]);
      setBookRefId("");
      return;
    }
    const fetchBookRefs = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/book-refs?page=1&limit=200&subject_id=${subjectId}`
        );
        const data = await res.json();
        setBookRefs(data.books || []);
      } catch (err) {
        console.error("Failed to fetch book refs", err);
      }
    };
    fetchBookRefs();
  }, [subjectId]);

  // File handling
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const triggerFileSelect = (ref: React.RefObject<HTMLInputElement | null>) => {
    ref.current?.click();
  };

  // Parse pasted text
  const parseAndFillForm = () => {
    if (!pastedText.trim()) {
      alert("Please paste question text first.");
      return;
    }

    const paragraphs = pastedText.split(/\n\s*\n/).filter((p) => p.trim());
    if (paragraphs.length < 2) {
      alert("Please include question and options (separated by empty lines).");
      return;
    }

    const questionText = paragraphs[0].trim();
    setQuestion(questionText);

    const optionLines = paragraphs[1].split("\n").filter((line) => line.trim());
    const options = optionLines.map((line) =>
      line.replace(/^[A-D][\.\)\-\s]+/i, "").trim()
    );

    [setOption1, setOption2, setOption3, setOption4].forEach((setter, idx) => {
      setter(options[idx] || "");
    });

    if (paragraphs.length >= 3) {
      const third = paragraphs[2].trim();
      const answerMatch = third.match(/\b([A-D])\b/i);
      if (answerMatch) {
        setAnswer(answerMatch[1].toUpperCase());
        if (paragraphs.length >= 4)
          setDes(paragraphs.slice(3).join("\n\n").trim());
      } else {
        setDes(paragraphs.slice(2).join("\n\n").trim());
        findAndSetAnswer(paragraphs.slice(1).join("\n\n"));
      }
    } else {
      findAndSetAnswer(paragraphs[1]);
    }

    alert("Form filled from pasted text!");
  };

  const findAndSetAnswer = (text: string) => {
    const patterns = [
      /answer[:\s]+([A-D])/i,
      /ans[:\s]+([A-D])/i,
      /\b([A-D])\b.*?correct/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        setAnswer(match[1].toUpperCase());
        return;
      }
    }
    setAnswer(""); // Let user fill manually
  };

  const clearForm = () => {
    setQuestion("");
    setAnswer("");
    setDes("");
    setOption1("");
    setOption2("");
    setOption3("");
    setOption4("");
    setPastedText("");
    setQuestionImagePreview(null);
    setAnswerImagePreview(null);
    setDesImagePreview(null);
    setOption1ImagePreview(null);
    setOption2ImagePreview(null);
    setOption3ImagePreview(null);
    setOption4ImagePreview(null);

    [
      questionImageRef,
      answerImageRef,
      desImageRef,
      option1ImageRef,
      option2ImageRef,
      option3ImageRef,
      option4ImageRef,
    ].forEach((ref) => {
      if (ref.current) ref.current.value = "";
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!subjectId) newErrors.subjectId = "Subject is required";
    if (!question.trim()) newErrors.question = "Question is required";
    if (!answer.trim() || !/^[A-D]$/i.test(answer))
      newErrors.answer = "Answer must be A, B, C, or D";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("subject_id", subjectId);
      if (chapterId) formData.append("chapter_id", chapterId);
      if (topicId) formData.append("topic_id", topicId);
      if (bookRefId) formData.append("book_ref_id", bookRefId);
      formData.append("question", question);
      formData.append("answer", answer.toUpperCase());
      if (des) formData.append("des", des);
      if (option1) formData.append("option1", option1);
      if (option2) formData.append("option2", option2);
      if (option3) formData.append("option3", option3);
      if (option4) formData.append("option4", option4);
      formData.append("uploadFolder", "questions");
      formData.append("is_published", isPublished.toString());

      const appendImage = (
        ref: React.RefObject<HTMLInputElement | null>,
        fieldName: string
      ) => {
        const file = ref.current?.files?.[0];
        if (file) formData.append(fieldName, file);
      };

      appendImage(questionImageRef, "question_image");
      appendImage(answerImageRef, "answer_image");
      appendImage(desImageRef, "des_image");
      appendImage(option1ImageRef, "option1_image");
      appendImage(option2ImageRef, "option2_image");
      appendImage(option3ImageRef, "option3_image");
      appendImage(option4ImageRef, "option4_image");

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      const res = await fetch(`${BASE_URL}/api/questions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.question) {
        alert("Question added successfully!");
        clearForm(); // Keeps dropdowns
      } else {
        alert(result.message || "Failed to add question");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      alert("Please select an Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", bulkFile);
    if (subjectId) formData.append("subject_id", subjectId);
    if (chapterId) formData.append("chapter_id", chapterId);
    if (topicId) formData.append("topic_id", topicId);
    if (bookRefId) formData.append("book_ref_id", bookRefId);
    formData.append("uploadFolder", "questions");

    setBulkUploading(true);
    setBulkResult(null);
    setShowErrors(false);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      const res = await fetch(`${BASE_URL}/api/questions/bulk`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result: BulkUploadResult = await res.json();
      setBulkResult(result);

      if (res.ok && result.success) {
        const fileInput = document.getElementById(
          "bulkFile"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        setBulkFile(null);
      } else {
        alert(result.message || "Bulk upload failed");
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert("Something went wrong during bulk upload.");
    } finally {
      setBulkUploading(false);
    }
  };

  const clearBulkUpload = () => {
    setBulkFile(null);
    setBulkResult(null);
    setShowErrors(false);
    const input = document.getElementById("bulkFile") as HTMLInputElement;
    if (input) input.value = "";
  };

  const optionConfig: OptionConfig[] = [
    {
      value: option1,
      setValue: setOption1,
      preview: option1ImagePreview,
      setPreview: setOption1ImagePreview,
      ref: option1ImageRef,
    },
    {
      value: option2,
      setValue: setOption2,
      preview: option2ImagePreview,
      setPreview: setOption2ImagePreview,
      ref: option2ImageRef,
    },
    {
      value: option3,
      setValue: setOption3,
      preview: option3ImagePreview,
      setPreview: setOption3ImagePreview,
      ref: option3ImageRef,
    },
    {
      value: option4,
      setValue: setOption4,
      preview: option4ImagePreview,
      setPreview: setOption4ImagePreview,
      ref: option4ImageRef,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Add New Question</h1>
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Subject & Metadata */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subjectId && (
                  <p className="text-red-500 text-sm">{errors.subjectId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter (Optional)</Label>
                <Select value={chapterId} onValueChange={setChapterId}>
                  <SelectTrigger id="chapter">
                    <SelectValue placeholder="Select Chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic (Optional)</Label>
                <Select value={topicId} onValueChange={setTopicId}>
                  <SelectTrigger id="topic">
                    <SelectValue placeholder="Select Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookRef">Book Reference (Optional)</Label>
                <Select value={bookRefId} onValueChange={setBookRefId}>
                  <SelectTrigger id="bookRef">
                    <SelectValue placeholder="Select Book Reference" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookRefs.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bulk Upload Section */}
          <div className="space-y-4 border border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-800">
                Bulk Upload via Excel
              </h2>
            </div>

            <div className="flex items-start gap-2 text-sm text-blue-700">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Upload an Excel file with multiple questions. Required columns:{" "}
                <strong>question</strong>, <strong>answer</strong>,{" "}
                <strong>subject_id</strong>. Optional: ,{" "}
                <strong>option1–option4</strong>, <strong>des</strong>,{" "}
                <strong>is_published</strong>.
                <br />
                <span className="text-rose-600 font-medium">
                  Note: Images are not supported in bulk upload.
                </span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="bulkFile"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {bulkFile && (
                  <p className="text-xs text-green-600 mt-1">
                    Selected: {bulkFile.name} (
                    {(bulkFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleBulkUpload}
                disabled={!bulkFile || bulkUploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {bulkUploading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Uploading...
                  </>
                ) : (
                  "Upload Excel"
                )}
              </Button>
              {(bulkFile || bulkResult) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearBulkUpload}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Bulk Result */}
            {bulkResult && (
              <div
                className={`p-4 rounded border ${
                  bulkResult.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex gap-3">
                  {bulkResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={
                        bulkResult.success ? "text-green-700" : "text-red-700"
                      }
                    >
                      {bulkResult.message}
                    </p>
                    {bulkResult.summary && (
                      <div className="mt-3 grid grid-cols-4 gap-3 text-sm">
                        <div className="text-center">
                          <p className="text-lg font-bold">
                            {bulkResult.summary.total}
                          </p>
                          <p className="text-gray-600">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">
                            {bulkResult.summary.success}
                          </p>
                          <p className="text-gray-600">Success</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-600">
                            {bulkResult.summary.failed}
                          </p>
                          <p className="text-gray-600">Failed</p>
                        </div>
                        {/* <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">
                            {bulkResult.summary.successRate}
                          </p>
                          <p className="text-gray-600">Success Rate</p>
                        </div> */}
                      </div>
                    )}
                    {bulkResult.errors && bulkResult.errors.length > 0 && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowErrors(!showErrors)}
                          className="text-red-600 p-0 h-auto"
                        >
                          {showErrors
                            ? "Hide Errors"
                            : `Show ${bulkResult.errors.length} Error(s)`}
                        </Button>
                        {showErrors && (
                          <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                            {bulkResult.errors.map((err, i) => (
                              <div
                                key={i}
                                className="p-2 bg-red-100 rounded mb-1"
                              >
                                <strong>Row {err.row}:</strong> {err.error}
                                <pre className="mt-1 text-gray-700 overflow-x-auto">
                                  {JSON.stringify(err.data, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Text Paste */}
          <div className="space-y-4 border border-gray-200 bg-gray-50 rounded-lg p-4">
            <Label className="text-lg font-medium">Paste Question Text</Label>
            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Question

Option A
Option B
Option C
Option D

Answer: B

Explanation...`}
              rows={6}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={parseAndFillForm}
                className="flex-1"
              >
                Parse & Fill Form
              </Button>
              <Button type="button" variant="outline" onClick={clearForm}>
                Clear Fields
              </Button>
            </div>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <Label>Question *</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question"
              rows={3}
            />
            {errors.question && (
              <p className="text-red-500 text-sm">{errors.question}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              {questionImagePreview ? (
                <div className="w-16 h-16 relative rounded overflow-hidden border">
                  <Image
                    src={questionImagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerFileSelect(questionImageRef)}
              >
                Upload Image
              </Button>
              <input
                type="file"
                ref={questionImageRef}
                accept="image/*"
                onChange={(e) => handleFileChange(e, setQuestionImagePreview)}
                className="hidden"
              />
            </div>
          </div>

          {/* Options (A–D) */}
          {optionConfig.map((config, idx) => {
            const letter = String.fromCharCode(65 + idx);
            return (
              <div key={letter} className="space-y-2">
                <Label>Option {letter}</Label>
                <Input
                  value={config.value}
                  onChange={(e) => config.setValue(e.target.value)}
                  placeholder={`Enter option ${letter}`}
                />
                <div className="flex items-center gap-4 mt-2">
                  {config.preview ? (
                    <div className="w-16 h-16 relative rounded overflow-hidden border">
                      <Image
                        src={config.preview}
                        alt={`Option ${letter}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => triggerFileSelect(config.ref)}
                  >
                    Upload Image
                  </Button>
                  <input
                    type="file"
                    ref={config.ref}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, config.setPreview)}
                    className="hidden"
                  />
                </div>
              </div>
            );
          })}

          {/* Answer */}
          <div className="space-y-2">
            <Label>Answer (A/B/C/D) *</Label>
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value.toUpperCase())}
              placeholder="A, B, C, or D"
              maxLength={1}
            />
            {errors.answer && (
              <p className="text-red-500 text-sm">{errors.answer}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              {answerImagePreview ? (
                <div className="w-16 h-16 relative rounded overflow-hidden border">
                  <Image
                    src={answerImagePreview}
                    alt="Answer"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerFileSelect(answerImageRef)}
              >
                Upload Image
              </Button>
              <input
                type="file"
                ref={answerImageRef}
                accept="image/*"
                onChange={(e) => handleFileChange(e, setAnswerImagePreview)}
                className="hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={des}
              onChange={(e) => setDes(e.target.value)}
              placeholder="Explanation or additional info"
              rows={2}
            />
            <div className="flex items-center gap-4 mt-2">
              {desImagePreview ? (
                <div className="w-16 h-16 relative rounded overflow-hidden border">
                  <Image
                    src={desImagePreview}
                    alt="Description"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerFileSelect(desImageRef)}
              >
                Upload Image
              </Button>
              <input
                type="file"
                ref={desImageRef}
                accept="image/*"
                onChange={(e) => handleFileChange(e, setDesImagePreview)}
                className="hidden"
              />
            </div>
          </div>

          {/* Publish Toggle */}
          <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
            <Label className="text-sm font-medium">Publish Status</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publish"
                  checked={isPublished}
                  onChange={() => setIsPublished(true)}
                  className="accent-green-600"
                />
                <span className="text-sm">Published</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publish"
                  checked={!isPublished}
                  onChange={() => setIsPublished(false)}
                  className="accent-orange-500"
                />
                <span className="text-sm">Save as Draft</span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-primary text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Question"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/questions")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
