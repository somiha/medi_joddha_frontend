// app/questions/add/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        const res = await fetch(`${BASE_URL}/api/subjects?page=1&limit=100`);
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
          `${BASE_URL}/api/chapters?page=1&limit=10&subject_id=${subjectId}`
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
          `${BASE_URL}/api/topics?chapter_id=${chapterId}&page=1&limit=10`
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
          `${BASE_URL}/api/book-refs?page=1&limit=10&subject_id=${subjectId}`
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

      const res = await fetch(`${BASE_URL}/api/questions`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.question) {
        alert("Question added successfully!");
        router.push("/questions");
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
          {/* Subject */}
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

          {/* Chapter */}
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

          {/* Topic */}
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

          {/* Book Reference */}
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

          {/* Question */}
          <div className="space-y-2">
            <Label>Question *</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question"
            />
            {errors.question && (
              <p className="text-red-500 text-sm">{errors.question}</p>
            )}
          </div>

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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Input
              value={des}
              onChange={(e) => setDes(e.target.value)}
              placeholder="Enter description (optional)"
            />
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

          {/* Submit */}
          <Button
            className="w-full text-white hover:opacity-90"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Question"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
