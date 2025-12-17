// components/questions/columns.tsx
"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash, Eye } from "lucide-react";
import Image from "next/image";

const BASE_URL = "https://medijoddha.save71.net";

// Define Option type
type Option = {
  id: number;
  name: string;
};

export interface QuestionItem {
  id: number;
  subject_id: number;
  question: string;
  answer: string; // A/B/C/D/E
  chapter_id?: number | null;
  topic_id?: number | null;
  des?: string | null;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  option4?: string | null;
  option5?: string | null;
  is_draft: boolean;
  is_published: boolean;
  book_ref_id?: number | null;

  // Image fields
  question_image?: string | null;
  answer_image?: string | null;
  des_image?: string | null;
  option1_image?: string | null;
  option2_image?: string | null;
  option3_image?: string | null;
  option4_image?: string | null;
  option5_image?: string | null;
}

// Helper: Get full answer label
function getAnswerWithOption(question: QuestionItem): string {
  const map: Record<string, string | null | undefined> = {
    A: question.option1,
    B: question.option2,
    C: question.option3,
    D: question.option4,
    E: question.option5,
  };
  const label = map[question.answer.toUpperCase()];
  return label
    ? `${question.answer} → ${label}`
    : question.answer || "No answer";
}

// Thumbnail Component using next/image
function ImageThumb({
  src,
  alt,
}: {
  src: string | null | undefined;
  alt: string;
}) {
  if (!src) return <span className="text-gray-400">–</span>;
  return (
    <div className="relative w-10 h-10 rounded overflow-hidden ml-1">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="40px"
        className="object-cover"
        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
      />
    </div>
  );
}

// Improved ImageViewer component
function ImageViewer({
  src,
  alt,
}: {
  src: string | null | undefined;
  alt: string;
}) {
  if (!src) return null;

  return (
    <div className="mt-2">
      <div className="relative w-full max-h-96 aspect-video bg-gray-50 rounded-lg border flex items-center justify-center">
        <Image
          src={src}
          alt={alt}
          width={800}
          height={400}
          className="object-contain max-w-full max-h-full"
          unoptimized
          onError={(e) => {
            console.error(`Failed to load image: ${src}`);
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1 text-center">{alt}</p>
    </div>
  );
}

function ViewQuestionModal({ question }: { question: QuestionItem }) {
  const [isOpen, setIsOpen] = useState(false);

  // Fixed: Properly filter and map options with their images
  const options = [
    {
      key: "A",
      value: question.option1,
      image: question.option1_image,
      hasContent: question.option1 || question.option1_image,
    },
    {
      key: "B",
      value: question.option2,
      image: question.option2_image,
      hasContent: question.option2 || question.option2_image,
    },
    {
      key: "C",
      value: question.option3,
      image: question.option3_image,
      hasContent: question.option3 || question.option3_image,
    },
    {
      key: "D",
      value: question.option4,
      image: question.option4_image,
      hasContent: question.option4 || question.option4_image,
    },
    {
      key: "E",
      value: question.option5,
      image: question.option5_image,
      hasContent: question.option5 || question.option5_image,
    },
  ].filter((opt) => opt.hasContent);

  return (
    <>
      <Button
        size="icon"
        className="text-white"
        onClick={() => setIsOpen(true)}
      >
        <Eye className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question #{question.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 text-sm">
            {/* Question */}
            <div>
              <p className="font-medium mb-1">Question:</p>
              <p className="whitespace-pre-wrap">{question.question}</p>
              {question.question_image && (
                <ImageViewer src={question.question_image} alt="Question" />
              )}
            </div>

            {/* Answer */}
            <div>
              <p className="font-medium mb-1">Answer:</p>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold text-base">
                {getAnswerWithOption(question)}
              </span>
            </div>

            {/* Description */}
            {question.des && (
              <div>
                <p className="font-medium mb-1">Description:</p>
                <p>{question.des}</p>
                {question.des_image && (
                  <ImageViewer src={question.des_image} alt="Description" />
                )}
              </div>
            )}

            {/* Options */}
            {options.length > 0 && (
              <div>
                <p className="font-medium mb-3">Options:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {options.map((opt) => (
                    <div
                      key={opt.key}
                      className={`flex gap-3 p-3 rounded-lg border-2 transition-all ${
                        question.answer.toUpperCase() === opt.key
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <span
                        className={`inline-flex w-8 h-8 items-center justify-center rounded-full font-bold text-sm flex-shrink-0 ${
                          question.answer.toUpperCase() === opt.key
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <div className="min-w-0 flex-1">
                        {opt.value && <p className="mb-2">{opt.value}</p>}
                        {opt.image && (
                          <ImageViewer
                            src={opt.image}
                            alt={`Option ${opt.key}`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answer Explanation Image */}
            {question.answer_image && (
              <div>
                <p className="font-medium mb-1">Answer Explanation:</p>
                <ImageViewer
                  src={question.answer_image}
                  alt="Answer explanation"
                />
              </div>
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

function EditQuestionModal({ question }: { question: QuestionItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<QuestionItem>(question);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState<string | null>(null);

  // Dropdown data states
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [chapters, setChapters] = useState<Option[]>([]);
  const [topics, setTopics] = useState<Option[]>([]);
  const [bookRefs, setBookRefs] = useState<Option[]>([]);

  // Fetch subjects on modal open
  useEffect(() => {
    if (isOpen) {
      const fetchSubjects = async () => {
        try {
          const res = await fetch(`${BASE_URL}/api/subjects?page=1&limit=200`);
          const data = await res.json();
          setSubjects(data.subjects || []);
        } catch (err) {
          console.error("Failed to fetch subjects", err);
        }
      };
      fetchSubjects();
    }
  }, [isOpen]);

  // Fetch chapters when subject changes
  useEffect(() => {
    if (!form.subject_id) {
      setChapters([]);
      return;
    }

    const fetchChapters = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/chapters?page=1&limit=200&subject_id=${form.subject_id}`
        );
        const data = await res.json();
        setChapters(data.chapters || []);
      } catch (err) {
        console.error("Failed to fetch chapters", err);
      }
    };

    fetchChapters();
  }, [form.subject_id]);

  // Fetch topics when chapter changes
  useEffect(() => {
    if (!form.chapter_id) {
      setTopics([]);
      return;
    }

    const fetchTopics = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/topics?chapter_id=${form.chapter_id}&page=1&limit=200`
        );
        const data = await res.json();
        setTopics(data.topics || []);
      } catch (err) {
        console.error("Failed to fetch topics", err);
      }
    };

    fetchTopics();
  }, [form.chapter_id]);

  // Fetch book refs when subject changes
  useEffect(() => {
    if (!form.subject_id) {
      setBookRefs([]);
      return;
    }

    const fetchBookRefs = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/book-refs?page=1&limit=200&subject_id=${form.subject_id}`
        );
        const data = await res.json();
        setBookRefs(data.books || []);
      } catch (err) {
        console.error("Failed to fetch book refs", err);
      }
    };

    fetchBookRefs();
  }, [form.subject_id]);

  // const handleChange = <K extends keyof QuestionItem>(
  //   key: K,
  //   value: QuestionItem[K]
  // ) => {
  //   setForm((prev) => ({ ...prev, [key]: value }));
  // };

  const handleChange = <K extends keyof QuestionItem>(
    key: K,
    value: QuestionItem[K]
  ) => {
    setForm((prev) => {
      const newForm = { ...prev, [key]: value };

      // Ensure draft and published are mutually exclusive
      if (key === "is_draft" && value === true) {
        newForm.is_published = false;
      } else if (key === "is_published" && value === true) {
        newForm.is_draft = false;
      }

      return newForm;
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof QuestionItem
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(field);

    const formData = new FormData();
    formData.append(field, file);
    formData.append("uploadFolder", "questions");

    try {
      const res = await fetch(`${BASE_URL}/api/questions/${question.id}`, {
        method: "PUT",
        body: formData,
      });

      const responseText = await res.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        alert(`Upload failed: Invalid response from server`);
        return;
      }

      if (res.ok) {
        let updatedImageUrl = null;

        if (data.question && data.question[field] !== undefined) {
          updatedImageUrl = data.question[field];
        } else if (data[field] !== undefined) {
          updatedImageUrl = data[field];
        } else if (data.question && field in data.question) {
          updatedImageUrl = data.question[field];
        }

        if (updatedImageUrl !== null && updatedImageUrl !== undefined) {
          const urlWithTimestamp = updatedImageUrl
            ? `${updatedImageUrl}?t=${Date.now()}`
            : null;
          handleChange(field, urlWithTimestamp);
          alert(`${field.replace("_", " ")} uploaded successfully!`);
        } else {
          alert(`Image uploaded successfully! Refreshing data...`);
          window.location.reload();
        }
      } else {
        alert(`Upload failed: ${data.message || `Status ${res.status}`}`);
      }
    } catch (err) {
      console.error(`Upload error for ${field}:`, err);
      alert("Upload failed - check console for details");
    } finally {
      setUploadLoading(null);
      e.target.value = "";
    }
  };

  // const handleSave = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await fetch(`${BASE_URL}/api/questions/${question.id}`, {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(form),
  //     });

  //     const result = await res.json();

  //     if (res.ok) {
  //       alert("Question updated successfully!");
  //       window.location.reload();
  //     } else {
  //       alert(`Update failed: ${result.message || "Unknown error"}`);
  //     }
  //   } catch (err) {
  //     console.error("Save error:", err);
  //     alert("Update failed - check console for details");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Convert boolean values to strings as expected by backend
      const dataToSend = {
        ...form,
        is_draft: form.is_draft ? "true" : "false",
        is_published: form.is_published ? "true" : "false",
        // Ensure other fields are properly formatted
        subject_id: form.subject_id,
        chapter_id: form.chapter_id || null,
        topic_id: form.topic_id || null,
        book_ref_id: form.book_ref_id || null,
        answer: form.answer.toUpperCase(),
      };

      const res = await fetch(`${BASE_URL}/api/questions/${question.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Question updated successfully!");
        window.location.reload();
      } else {
        alert(`Update failed: ${result.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Update failed - check console for details");
    } finally {
      setLoading(false);
    }
  };
  const removeImage = (field: keyof QuestionItem) => {
    if (confirm("Are you sure you want to remove this image?")) {
      handleChange(field, null);
    }
  };

  // Toggle status handlers
  // Toggle status handlers - simplified
  const toggleDraftStatus = () => {
    const newDraftStatus = !form.is_draft;
    handleChange("is_draft", newDraftStatus);
    if (newDraftStatus) {
      handleChange("is_published", false);
    }
  };

  const togglePublishStatus = () => {
    const newPublishedStatus = !form.is_published;
    handleChange("is_published", newPublishedStatus);
    if (newPublishedStatus) {
      handleChange("is_draft", false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        className="text-white"
        onClick={() => setIsOpen(true)}
      >
        <Pencil className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question #{question.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select
                value={form.subject_id ? String(form.subject_id) : ""}
                onValueChange={(value) =>
                  handleChange("subject_id", parseInt(value))
                }
              >
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
            </div>

            {/* Chapter */}
            <div className="space-y-2">
              <Label htmlFor="chapter">Chapter (Optional)</Label>
              <Select
                value={form.chapter_id ? String(form.chapter_id) : ""}
                onValueChange={(value) =>
                  handleChange("chapter_id", value ? parseInt(value) : null)
                }
              >
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

            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Topic (Optional)</Label>
              <Select
                value={form.topic_id ? String(form.topic_id) : ""}
                onValueChange={(value) =>
                  handleChange("topic_id", value ? parseInt(value) : null)
                }
              >
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

            {/* Book Reference */}
            <div className="space-y-2">
              <Label htmlFor="bookRef">Book Reference (Optional)</Label>
              <Select
                value={form.book_ref_id ? String(form.book_ref_id) : ""}
                onValueChange={(value) =>
                  handleChange("book_ref_id", value ? parseInt(value) : null)
                }
              >
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

            {/* Question */}
            <div className="space-y-2">
              <Label htmlFor="question">Question Text *</Label>
              <Input
                id="question"
                value={form.question}
                onChange={(e) => handleChange("question", e.target.value)}
                placeholder="Enter question text"
                required
              />

              <div className="space-y-1">
                <Label
                  htmlFor="question-image"
                  className="text-sm text-gray-600"
                >
                  Question Image{" "}
                  {uploadLoading === "question_image" && "(Uploading...)"}
                </Label>
                <Input
                  id="question-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "question_image")}
                  className="text-xs"
                  disabled={!!uploadLoading}
                />
                {form.question_image && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative w-16 h-16 border rounded overflow-hidden">
                      <Image
                        src={form.question_image}
                        alt="Question"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeImage("question_image")}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Answer */}
            <div className="space-y-2">
              <Label htmlFor="answer">Answer (A/B/C/D/E) *</Label>
              <Input
                id="answer"
                placeholder="A, B, C, D, or E"
                value={form.answer}
                onChange={(e) =>
                  handleChange("answer", e.target.value.toUpperCase())
                }
                maxLength={1}
                required
              />

              <div className="space-y-1">
                <Label htmlFor="answer-image" className="text-sm text-gray-600">
                  Answer Image{" "}
                  {uploadLoading === "answer_image" && "(Uploading...)"}
                </Label>
                <Input
                  id="answer-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "answer_image")}
                  className="text-xs"
                  disabled={!!uploadLoading}
                />
                {form.answer_image && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative w-16 h-16 border rounded overflow-hidden">
                      <Image
                        src={form.answer_image}
                        alt="Answer"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeImage("answer_image")}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.des || ""}
                onChange={(e) => handleChange("des", e.target.value)}
                placeholder="Enter description (optional)"
              />

              <div className="space-y-1">
                <Label htmlFor="des-image" className="text-sm text-gray-600">
                  Description Image{" "}
                  {uploadLoading === "des_image" && "(Uploading...)"}
                </Label>
                <Input
                  id="des-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "des_image")}
                  className="text-xs"
                  disabled={!!uploadLoading}
                />
                {form.des_image && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative w-16 h-16 border rounded overflow-hidden">
                      <Image
                        src={form.des_image}
                        alt="Description"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeImage("des_image")}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Options</Label>
              {(
                ["option1", "option2", "option3", "option4", "option5"] as const
              ).map((optKey) => (
                <div key={optKey} className="space-y-2 p-3 border rounded-lg">
                  <Label className="font-medium">
                    {optKey.replace("option", "Option ").toUpperCase()}
                  </Label>
                  <Input
                    value={form[optKey] || ""}
                    onChange={(e) => handleChange(optKey, e.target.value)}
                    placeholder={`Enter ${optKey.replace(
                      "option",
                      "option "
                    )} text`}
                  />

                  <div className="space-y-1">
                    <Label
                      htmlFor={`${optKey}-image`}
                      className="text-sm text-gray-600"
                    >
                      {optKey.replace("option", "Option ")} Image{" "}
                      {uploadLoading === `${optKey}_image` && "(Uploading...)"}
                    </Label>
                    <Input
                      id={`${optKey}-image`}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(
                          e,
                          `${optKey}_image` as keyof QuestionItem
                        )
                      }
                      className="text-xs"
                      disabled={!!uploadLoading}
                    />
                    {form[`${optKey}_image` as keyof QuestionItem] && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative w-16 h-16 border rounded overflow-hidden">
                          <Image
                            src={
                              form[
                                `${optKey}_image` as keyof QuestionItem
                              ] as string
                            }
                            alt={optKey}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            removeImage(`${optKey}_image` as keyof QuestionItem)
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Status Options */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <Label className="text-lg font-semibold">Question Status</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Draft Status */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="space-y-1">
                    <Label className="font-medium">Draft Mode</Label>
                    <p className="text-sm text-gray-600">
                      {form.is_draft
                        ? "Question is in draft mode (not visible to users)"
                        : "Question is not in draft mode"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={form.is_draft ? "default" : "outline"}
                    size="sm"
                    onClick={toggleDraftStatus}
                    className={
                      form.is_draft ? "bg-blue-600 hover:bg-blue-700" : ""
                    }
                  >
                    {form.is_draft ? "Draft" : "Set Draft"}
                  </Button>
                </div>

                {/* Publish Status */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="space-y-1">
                    <Label className="font-medium">Publish Status</Label>
                    <p className="text-sm text-gray-600">
                      {form.is_published
                        ? "Question is published and visible to users"
                        : "Question is not published"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={form.is_published ? "default" : "outline"}
                    size="sm"
                    onClick={togglePublishStatus}
                    className={
                      form.is_published ? "bg-green-600 hover:bg-green-700" : ""
                    }
                  >
                    {form.is_published ? "Published" : "Publish"}
                  </Button>
                </div>
              </div>

              {/* Status Summary */}
              <div className="p-3 bg-white rounded-lg border">
                <Label className="font-medium mb-2 block">Current Status</Label>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      form.is_draft
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                        : "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${
                        form.is_draft ? "bg-yellow-500" : "bg-gray-400"
                      }`}
                    ></span>
                    Draft: {form.is_draft ? "Yes" : "No"}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      form.is_published
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-gray-100 text-gray-800 border border-gray-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${
                        form.is_published ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></span>
                    Published: {form.is_published ? "Yes" : "No"}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {form.is_draft && form.is_published
                    ? "Question cannot be both draft and published. Please choose one status."
                    : form.is_draft
                    ? "This question is in draft mode and not visible to users."
                    : form.is_published
                    ? "This question is published and visible to users."
                    : "This question has no status set."}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 text-sm text-gray-600">
              Fields marked with * are required
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading || !!uploadLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !!uploadLoading}
                className="min-w-20 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Delete Modal
function DeleteQuestionModal({ id }: { id: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/questions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        className="text-white"
        onClick={() => setIsOpen(true)}
      >
        <Trash className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete Question #{id}?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Table Columns
export const questionColumns: ColumnDef<QuestionItem>[] = [
  { accessorKey: "id", header: "ID" },
  {
    accessorKey: "question",
    header: "Question",
    cell: ({ row }) => (
      <span title={row.original.question} className="block max-w-xs truncate">
        {row.original.question}
      </span>
    ),
  },
  {
    accessorKey: "answer",
    header: "Answer",
    cell: ({ row }) => {
      const q = row.original;
      return (
        <span className="font-mono text-sm">{getAnswerWithOption(q)}</span>
      );
    },
  },
  {
    id: "question_image",
    header: "Q Img",
    cell: ({ row }) => (
      <ImageThumb src={row.original.question_image} alt="Question" />
    ),
  },
  {
    id: "des_image",
    header: "Des Img",
    cell: ({ row }) => (
      <ImageThumb src={row.original.des_image} alt="Description" />
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <ViewQuestionModal question={row.original} />
        <EditQuestionModal question={row.original} />
        <DeleteQuestionModal id={row.original.id} />
      </div>
    ),
  },
];
