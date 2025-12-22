"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload } from "lucide-react";

const BASE_URL = "https://medijoddha.save71.net";

interface Chapter {
  id: number;
  subject_id: number;
  name: string;
  title: string;
}

interface Subject {
  id: number;
  name: string;
  title: string;
  course_id?: number;
}

interface Course {
  id: number;
  name: string;
  program_id?: number;
}

interface Program {
  id: number;
  name: string;
}

interface ChapterWithHierarchy extends Chapter {
  subject_name: string;
  subject_title: string;
  course_name: string;
  program_name: string;
}

export default function AddTopicPage() {
  const [chapterId, setChapterId] = useState<string>("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [short_des, setShortDes] = useState("");
  const [is_draft, setIsDraft] = useState(false);
  const [is_published, setIsPublished] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chapters, setChapters] = useState<ChapterWithHierarchy[]>([]);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch all required data on mount
  useEffect(() => {
    fetchChaptersWithHierarchy();
  }, []);

  const fetchChaptersWithHierarchy = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      setLoading(false);
      return;
    }

    try {
      // Fetch all data in parallel
      const [chaptersRes, subjectsRes, coursesRes, programsRes] =
        await Promise.all([
          fetch(`${BASE_URL}/api/chapters?page=1&limit=500`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}/api/subjects?page=1&limit=500`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}/api/courses?page=1&limit=100`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}/api/programs?page=1&limit=100`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      if (
        !chaptersRes.ok ||
        !subjectsRes.ok ||
        !coursesRes.ok ||
        !programsRes.ok
      ) {
        throw new Error("One or more API requests failed");
      }

      // Parse responses
      const chaptersData = await chaptersRes.json();
      const subjectsData = await subjectsRes.json();
      const coursesData = await coursesRes.json();
      const programsData = await programsRes.json();

      // Extract data
      const chaptersList = chaptersData.chapters || chaptersData.data || [];
      const subjectsList = subjectsData.subjects || subjectsData.data || [];
      const coursesList = coursesData.courses || coursesData.data || [];
      const programsList = programsData.programs || programsData.data || [];

      // Build lookup maps
      const subjectMap = new Map<number, Subject>();
      subjectsList.forEach((subject: Subject) =>
        subjectMap.set(subject.id, subject)
      );

      const courseMap = new Map<number, Course>();
      coursesList.forEach((course: Course) => courseMap.set(course.id, course));

      const programMap = new Map<number, Program>();
      programsList.forEach((program: Program) =>
        programMap.set(program.id, program)
      );

      // Enrich chapters with hierarchy info
      const enrichedChapters: ChapterWithHierarchy[] = chaptersList.map(
        (chapter: Chapter) => {
          const subject = subjectMap.get(chapter.subject_id);
          const course = subject?.course_id
            ? courseMap.get(subject.course_id)
            : undefined;
          const program = course?.program_id
            ? programMap.get(course.program_id)
            : undefined;

          return {
            ...chapter,
            subject_name: subject?.name || `Subject #${chapter.subject_id}`,
            subject_title: subject?.title || "",
            course_name: course?.name || "No Course Assigned",
            program_name: program?.name || "No Program",
          };
        }
      );

      setChapters(enrichedChapters);
    } catch (err) {
      console.error("Failed to fetch chapter hierarchy:", err);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!chapterId) newErrors.chapterId = "Chapter selection is required";
    if (!name.trim()) newErrors.name = "Topic name is required";
    if (!title.trim()) newErrors.title = "Topic title is required";
    if (!short_des.trim())
      newErrors.short_des = "Short description is required";

    if (is_draft && is_published) {
      newErrors.status = "Topic cannot be both draft and published";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("No authentication token found");
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("chapter_id", chapterId);
      formData.append("name", name);
      formData.append("title", title);
      formData.append("short_des", short_des);
      formData.append("is_draft", is_draft.toString());
      formData.append("is_published", is_published.toString());
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(`${BASE_URL}/api/topics`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.ok && result.topic) {
        alert("Topic added successfully!");
        router.push("/topics");
      } else {
        alert(result.message || "Failed to add topic");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setChapterId("");
    setName("");
    setTitle("");
    setShortDes("");
    setIsDraft(false);
    setIsPublished(false);
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
  };

  // Group chapters by program → course → subject
  const chaptersByHierarchy = chapters.reduce((acc, chapter) => {
    const programKey = chapter.program_name;
    const courseKey = chapter.course_name;
    const subjectKey = `${chapter.subject_name} (ID: ${chapter.subject_id})`;

    if (!acc[programKey]) acc[programKey] = {};
    if (!acc[programKey][courseKey]) acc[programKey][courseKey] = {};
    if (!acc[programKey][courseKey][subjectKey])
      acc[programKey][courseKey][subjectKey] = [];

    acc[programKey][courseKey][subjectKey].push(chapter);
    return acc;
  }, {} as Record<string, Record<string, Record<string, ChapterWithHierarchy[]>>>);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add New Topic</h1>
        <Button variant="outline" onClick={() => router.push("/topics")}>
          ← Back to Topics
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Chapter Selection */}
          <div className="space-y-2">
            <Label htmlFor="chapter">Chapter *</Label>
            <Select
              value={chapterId}
              onValueChange={setChapterId}
              disabled={loading}
            >
              <SelectTrigger
                id="chapter"
                className={errors.chapterId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select Chapter" />
              </SelectTrigger>
              <SelectContent className="max-h-96">
                {loading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      Loading chapters...
                    </div>
                  </SelectItem>
                ) : chapters.length === 0 ? (
                  <SelectItem value="no-chapters" disabled>
                    No chapters found. Please create a chapter first.
                  </SelectItem>
                ) : (
                  Object.entries(chaptersByHierarchy).map(
                    ([programName, courses]) => (
                      <div key={programName}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 border-b">
                          📚 {programName}
                        </div>
                        {Object.entries(courses).map(
                          ([courseName, subjects]) => (
                            <div key={courseName}>
                              <div className="px-4 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b">
                                📁 {courseName}
                              </div>
                              {Object.entries(subjects).map(
                                ([subjectName, subjectChapters]) => (
                                  <div key={subjectName}>
                                    <div className="px-6 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border-b">
                                      📘 {subjectName}
                                    </div>
                                    {subjectChapters.map((chapter) => (
                                      <SelectItem
                                        key={chapter.id}
                                        value={chapter.id.toString()}
                                        className="pl-8"
                                      >
                                        <div className="flex flex-col">
                                          <div className="flex justify-between items-start">
                                            <span className="font-medium">
                                              {chapter.name}
                                            </span>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                                              ID: {chapter.id}
                                            </span>
                                          </div>
                                          <span className="text-xs text-gray-500 mt-1 line-clamp-1">
                                            {chapter.title}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </div>
                                )
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )
                  )
                )}
              </SelectContent>
            </Select>
            {errors.chapterId && (
              <p className="text-red-500 text-sm">{errors.chapterId}</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Select the parent chapter for this topic
              </p>
              {chapterId && (
                <div className="text-xs text-gray-600">
                  {(() => {
                    const selectedChapter = chapters.find(
                      (c) => c.id.toString() === chapterId
                    );
                    return selectedChapter ? (
                      <span>
                        <span className="font-medium">
                          {selectedChapter.program_name} →{" "}
                          {selectedChapter.course_name} →{" "}
                          {selectedChapter.subject_name} →{" "}
                          {selectedChapter.name}
                        </span>
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <Label>Topic Image (Optional)</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={triggerFileSelect}
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 text-center px-2">
                    Click to upload
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerFileSelect}
                >
                  Choose Image
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove Image
                  </Button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: JPEG, JPG, PNG, WebP
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Topic Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Plastid"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Topic Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Understanding Plastids"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Short Description *</Label>
            <Textarea
              id="description"
              value={short_des}
              onChange={(e) => setShortDes(e.target.value)}
              placeholder="e.g., Learn Plastid of a Plant"
              rows={4}
              className={errors.short_des ? "border-red-500" : ""}
            />
            {errors.short_des && (
              <p className="text-red-500 text-sm">{errors.short_des}</p>
            )}
          </div>

          {/* Status Settings */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-medium">Status Settings</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="draft-mode">Draft Mode</Label>
                <p className="text-sm text-gray-500">
                  Save as draft (not visible to users)
                </p>
              </div>
              <Switch
                id="draft-mode"
                checked={is_draft}
                onCheckedChange={(checked) => {
                  setIsDraft(checked);
                  if (checked) setIsPublished(false);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="publish-mode">Publish Now</Label>
                <p className="text-sm text-gray-500">
                  Make topic visible to users immediately
                </p>
              </div>
              <Switch
                id="publish-mode"
                checked={is_published}
                onCheckedChange={(checked) => {
                  setIsPublished(checked);
                  if (checked) setIsDraft(false);
                }}
              />
            </div>
            {errors.status && (
              <p className="text-red-500 text-sm">{errors.status}</p>
            )}
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium mb-2">Preview Status:</p>
              <div className="flex gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    is_draft
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      : "bg-gray-100 text-gray-800 border border-gray-300"
                  }`}
                >
                  Draft: {is_draft ? "Yes" : "No"}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    is_published
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-gray-100 text-gray-800 border border-gray-300"
                  }`}
                >
                  Published: {is_published ? "Yes" : "No"}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {is_draft && is_published
                  ? "⚠️ Topic cannot be both draft and published"
                  : is_draft
                  ? "Topic will be saved as draft (not visible to users)"
                  : is_published
                  ? "Topic will be published immediately"
                  : "Topic will be saved with no status set"}
              </p>
            </div>
          </div>

          {/* Selected Chapter Info */}
          {chapterId && (
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">
                Selected Chapter Info
              </h3>
              {(() => {
                const selectedChapter = chapters.find(
                  (c) => c.id.toString() === chapterId
                );
                if (!selectedChapter) return null;
                return (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Chapter Name:</p>
                        <p className="font-medium">{selectedChapter.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Chapter Title:</p>
                        <p className="font-medium">{selectedChapter.title}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Subject:</p>
                        <p className="font-medium">
                          {selectedChapter.subject_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Course:</p>
                        <p className="font-medium">
                          {selectedChapter.course_name}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Program:</p>
                        <p className="font-medium">
                          {selectedChapter.program_name}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        {selectedChapter.program_name} →{" "}
                        {selectedChapter.course_name} →{" "}
                        {selectedChapter.subject_name} → {selectedChapter.name}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              disabled={isSubmitting}
              className="flex-1"
            >
              Clear Form
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 text-white hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save Topic"
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Fields marked with * are required
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
