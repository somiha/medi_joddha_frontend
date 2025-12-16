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

const BASE_URL = "https://medijoddha.save71.net";

interface Option {
  id: number;
  name: string;
}

export default function AddQuestionPage() {
  const [subjectId, setSubjectId] = useState<string>("");
  const [chapterId, setChapterId] = useState<string>("");
  const [topicId, setTopicId] = useState<string>("");
  const [bookRefId, setBookRefId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [des, setDes] = useState("");

  // Options text
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [option5, setOption5] = useState("");

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
  const [option5ImagePreview, setOption5ImagePreview] = useState<string | null>(
    null
  );

  // Text paste state
  const [pastedText, setPastedText] = useState("");

  // File input refs
  const questionImageRef = useRef<HTMLInputElement | null>(null);
  const answerImageRef = useRef<HTMLInputElement | null>(null);
  const desImageRef = useRef<HTMLInputElement | null>(null);
  const option1ImageRef = useRef<HTMLInputElement | null>(null);
  const option2ImageRef = useRef<HTMLInputElement | null>(null);
  const option3ImageRef = useRef<HTMLInputElement | null>(null);
  const option4ImageRef = useRef<HTMLInputElement | null>(null);
  const option5ImageRef = useRef<HTMLInputElement | null>(null);

  // Dropdown data
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
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("authToken")
            : null;

        if (!token) {
          console.error("No token found");
          return;
        }

        const res = await fetch(`${BASE_URL}/api/subjects?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        setSubjects(data.subjects || []);
      } catch (err) {
        console.error("Failed to fetch subjects", err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch chapters when subject changes
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

  // Fetch topics when chapter changes
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

  // Fetch book refs when subject changes
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

  // Parse pasted text and fill form fields
  const parseAndFillForm = () => {
    if (!pastedText.trim()) {
      alert("Please paste some text first");
      return;
    }

    // Split by double newlines (paragraphs)
    const paragraphs = pastedText.split(/\n\s*\n/).filter((p) => p.trim());

    if (paragraphs.length < 2) {
      alert(
        "Please provide at least question and options separated by empty lines"
      );
      return;
    }

    // First paragraph is always the question
    const questionText = paragraphs[0].trim();
    setQuestion(questionText);

    // Second paragraph contains options (separated by single newlines)
    const optionsParagraph = paragraphs[1];
    const optionLines = optionsParagraph
      .split("\n")
      .filter((line) => line.trim());

    // Extract options (remove A., B., etc. prefixes if present)
    const options = optionLines.map((line) => {
      // Remove common prefixes like A., B., 1., 2., etc.
      return line.replace(/^[A-E][\.\)\-\s]+/i, "").trim();
    });

    // Set options
    const optionSetters = [
      setOption1,
      setOption2,
      setOption3,
      setOption4,
      setOption5,
    ];
    optionSetters.forEach((setter, index) => {
      if (index < options.length) {
        setter(options[index]);
      } else {
        setter(""); // Clear any previous options
      }
    });

    // Third paragraph could be answer or description
    if (paragraphs.length >= 3) {
      const thirdParagraph = paragraphs[2].trim();

      // Check if this paragraph contains the answer (look for A/B/C/D/E)
      const answerMatch = thirdParagraph.match(/\b([A-E])\b/i);
      if (answerMatch) {
        setAnswer(answerMatch[1].toUpperCase());

        // If there's a fourth paragraph, it's the description
        if (paragraphs.length >= 4) {
          setDes(paragraphs.slice(3).join("\n\n").trim());
        } else {
          setDes("");
        }
      } else {
        // Third paragraph is description, answer might be in options or we need to detect it
        setDes(paragraphs.slice(2).join("\n\n").trim());

        // Try to find answer in the options paragraph or description
        findAndSetAnswer(
          optionsParagraph + "\n\n" + paragraphs.slice(2).join("\n\n")
        );
      }
    } else {
      // Only question and options provided, try to find answer in options
      findAndSetAnswer(optionsParagraph);
    }

    alert("Form fields filled from pasted text!");
  };

  // Helper function to find and set answer from text
  const findAndSetAnswer = (text: string) => {
    // Look for patterns like "Answer: A", "Ans: B", "Correct: C", etc.
    const answerPatterns = [
      /(?:answer|ans|correct)[:\s]+([A-E])/i,
      /\(([A-E])\)/,
      /\b([A-E])\b.*?(?:answer|correct)/i,
    ];

    for (const pattern of answerPatterns) {
      const match = text.match(pattern);
      if (match) {
        setAnswer(match[1].toUpperCase());
        return;
      }
    }

    // If no clear answer found, leave it empty for manual input
    setAnswer("");
  };

  // Clear all form fields
  const clearForm = () => {
    // Clear only the form fields, NOT the dropdown selections
    setQuestion("");
    setAnswer("");
    setDes("");
    setOption1("");
    setOption2("");
    setOption3("");
    setOption4("");
    setOption5("");
    setPastedText("");
    setQuestionImagePreview(null);
    setAnswerImagePreview(null);
    setDesImagePreview(null);
    setOption1ImagePreview(null);
    setOption2ImagePreview(null);
    setOption3ImagePreview(null);
    setOption4ImagePreview(null);
    setOption5ImagePreview(null);

    // Reset file inputs
    if (questionImageRef.current) questionImageRef.current.value = "";
    if (answerImageRef.current) answerImageRef.current.value = "";
    if (desImageRef.current) desImageRef.current.value = "";
    if (option1ImageRef.current) option1ImageRef.current.value = "";
    if (option2ImageRef.current) option2ImageRef.current.value = "";
    if (option3ImageRef.current) option3ImageRef.current.value = "";
    if (option4ImageRef.current) option4ImageRef.current.value = "";
    if (option5ImageRef.current) option5ImageRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!subjectId) newErrors.subjectId = "Subject is required";
    if (!question.trim()) newErrors.question = "Question is required";
    if (!answer.trim()) newErrors.answer = "Answer (A/B/C/D/E) is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
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
      if (option5) formData.append("option5", option5);
      formData.append("uploadFolder", "questions");

      // Helper to safely append image
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
      appendImage(option5ImageRef, "option5_image");

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const res = await fetch(`${BASE_URL}/api/questions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.question) {
        alert("Question added successfully!");
        // Clear only form fields but keep dropdown selections
        setQuestion("");
        setAnswer("");
        setDes("");
        setOption1("");
        setOption2("");
        setOption3("");
        setOption4("");
        setOption5("");
        setPastedText("");
        setQuestionImagePreview(null);
        setAnswerImagePreview(null);
        setDesImagePreview(null);
        setOption1ImagePreview(null);
        setOption2ImagePreview(null);
        setOption3ImagePreview(null);
        setOption4ImagePreview(null);
        setOption5ImagePreview(null);

        // Reset file inputs
        if (questionImageRef.current) questionImageRef.current.value = "";
        if (answerImageRef.current) answerImageRef.current.value = "";
        if (desImageRef.current) desImageRef.current.value = "";
        if (option1ImageRef.current) option1ImageRef.current.value = "";
        if (option2ImageRef.current) option2ImageRef.current.value = "";
        if (option3ImageRef.current) option3ImageRef.current.value = "";
        if (option4ImageRef.current) option4ImageRef.current.value = "";
        if (option5ImageRef.current) option5ImageRef.current.value = "";

        // Keep dropdown selections as they were
        // Don't navigate away, stay on the same page
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

  // Safe mapping for options
  const optionConfig = [
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
    {
      value: option5,
      setValue: setOption5,
      preview: option5ImagePreview,
      setPreview: setOption5ImagePreview,
      ref: option5ImageRef,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-xl font-semibold mb-6">Add New Question</h2>
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Subject, Chapter, Topic, Book Ref in one line two rows */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First row */}
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
              {/* Second row */}
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
          {/* Text Paste Area */}
          <div className="space-y-4 border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <Label className="text-lg font-medium">Paste Question Text</Label>
            <p className="text-sm text-gray-600">
              Paste your question text below. Format: Question (first
              paragraph), Options (optional, second paragraph, one per line),
              Answer (auto-detected), Description (optional, subsequent
              paragraphs)
            </p>

            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Example:
কোনটি নিউক্লিয়াসের গাঠনিক উপাদান?

সিস্টার্নি
ভেসিকল
ক্রিস্টি
ক্রোমোসোম

D

ক্রোমোজোম হল একটি দীর্ঘ ডিএনএ অণু যাতে একটি জীবের জিনগত উপাদানের একটি অংশ বা সমস্ত অংশ বিদ্যমান থাকে। বেশিরভাগ প্রকৃতকোষী (ইউক্যারিওটিক) জীবের ক্রোমোজোমে প্যাকেজিং প্রোটিন থাকে যাকে হিস্টোন বলা হয় যা ক্রমোজোমের অখণ্ডতা বজায় রাখতে চ্যাপেরোন প্রোটিনের সাহায্যে ডিএনএ অণুকে আবদ্ধ করে এবং ঘনীভূত করে।`}
              rows={8}
              className="w-full"
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
                Clear All Fields
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
            />
            {errors.question && (
              <p className="text-red-500 text-sm">{errors.question}</p>
            )}

            {/* Question Image Upload */}
            <div className="flex items-center gap-4 mt-2">
              {questionImagePreview ? (
                <div className="w-16 h-16 relative rounded overflow-hidden border">
                  <Image
                    src={questionImagePreview}
                    alt="Question Preview"
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
                type="button"
                variant="outline"
                size="sm"
                onClick={() => triggerFileSelect(questionImageRef)}
              >
                Choose Question Image
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
          {/* Options with Images */}
          {optionConfig.map((config, idx) => {
            const letter = String.fromCharCode(65 + idx); // A, B, C...

            return (
              <div key={`option-${idx}`} className="space-y-2">
                <Label>Option {letter} (Optional)</Label>
                <Input
                  value={config.value ?? ""}
                  onChange={(e) => config.setValue(e.target.value)}
                  placeholder={`Enter option ${letter}`}
                />

                {/* Image Upload */}
                <div className="flex items-center gap-4 mt-2">
                  {config.preview ? (
                    <div className="w-16 h-16 relative rounded overflow-hidden border">
                      <Image
                        src={config.preview}
                        alt={`Option ${letter} Preview`}
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
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => triggerFileSelect(config.ref)}
                  >
                    Choose Image
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
            <Label>Answer (A/B/C/D/E) *</Label>
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value.toUpperCase())}
              placeholder="Enter answer (A, B, C, D, or E)"
              maxLength={1}
            />
            {errors.answer && (
              <p className="text-red-500 text-sm">{errors.answer}</p>
            )}

            {/* Answer Image Upload */}
            <div className="flex items-center gap-4 mt-2">
              {answerImagePreview ? (
                <div className="w-16 h-16 relative rounded overflow-hidden border">
                  <Image
                    src={answerImagePreview}
                    alt="Answer Preview"
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
                type="button"
                variant="outline"
                size="sm"
                onClick={() => triggerFileSelect(answerImageRef)}
              >
                Choose Answer Image
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
            <Input
              value={des}
              onChange={(e) => setDes(e.target.value)}
              placeholder="Enter description (optional)"
            />

            {/* Description Image Upload */}
            <div className="flex items-center gap-4 mt-2">
              {desImagePreview ? (
                <div className="w-16 h-16 relative rounded overflow-hidden border">
                  <Image
                    src={desImagePreview}
                    alt="Description Preview"
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
                type="button"
                variant="outline"
                size="sm"
                onClick={() => triggerFileSelect(desImageRef)}
              >
                Choose Description Image
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
          \{/* Submit */}
          <div className="flex gap-3">
            <Button
              className="flex-1 text-white hover:opacity-90"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Question"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/questions")}
            >
              Back to Questions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
