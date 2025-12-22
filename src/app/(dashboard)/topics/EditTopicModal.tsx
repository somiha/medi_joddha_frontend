"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Pencil, Upload } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { TopicWithHierarchy } from "./types";

const BASE_URL = "https://medijoddha.save71.net";

// Interfaces
interface Chapter {
  id: number;
  subject_id: number;
  name: string;
  title: string;
  serial_id: number;
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

export function EditTopicModal({ topic }: { topic: TopicWithHierarchy }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<TopicWithHierarchy>(topic);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    topic.image || null
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [chapters, setChapters] = useState<ChapterWithHierarchy[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    await fetchChaptersWithHierarchy();
  };

  const fetchChaptersWithHierarchy = async () => {
    setLoadingChapters(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      setLoadingChapters(false);
      return;
    }

    try {
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

      const chaptersData = await chaptersRes.json();
      const subjectsData = await subjectsRes.json();
      const coursesData = await coursesRes.json();
      const programsData = await programsRes.json();

      const chaptersList = chaptersData.chapters || chaptersData.data || [];
      const subjectsList = subjectsData.subjects || subjectsData.data || [];
      const coursesList = coursesData.courses || coursesData.data || [];
      const programsList = programsData.programs || programsData.data || [];

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
      setLoadingChapters(false);
    }
  };

  const handleChange = <K extends keyof TopicWithHierarchy>(
    key: K,
    value: TopicWithHierarchy[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleChapterChange = (chapterId: string) => {
    handleChange("chapter_id", parseInt(chapterId));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("No authentication token found");
      setUploadingImage(false);
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("chapter_id", form.chapter_id.toString());
    formData.append("name", form.name);
    formData.append("title", form.title);
    formData.append("short_des", form.short_des);
    formData.append("is_draft", form.is_draft.toString());
    formData.append("is_published", form.is_published.toString());

    try {
      const res = await fetch(`${BASE_URL}/api/topics/${topic.id}`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.topic?.image) {
          const newImageUrl = `${data.topic.image}?t=${Date.now()}`;
          handleChange("image", newImageUrl);
          setImagePreview(newImageUrl);
          alert("Image uploaded successfully!");
        }
      } else {
        const error = await res.json();
        alert(`Upload failed: ${error.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed - check console for details");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("No authentication token found");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/api/topics/${topic.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chapter_id: form.chapter_id,
          name: form.name,
          title: form.title,
          short_des: form.short_des,
          is_draft: form.is_draft,
          is_published: form.is_published,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Topic updated successfully!");
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

  const removeImage = () => {
    if (confirm("Are you sure you want to remove this image?")) {
      handleChange("image", null);
      setImagePreview(null);
    }
  };

  // Get selected chapter info
  const selectedChapter = chapters.find(
    (chapter) => chapter.id === form.chapter_id
  );

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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Topic #{topic.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Chapter Selection */}
            <div className="space-y-2">
              <Label htmlFor="chapter">Chapter *</Label>
              <Select
                value={form.chapter_id.toString()}
                onValueChange={handleChapterChange}
                disabled={loadingChapters}
              >
                <SelectTrigger id="chapter">
                  <SelectValue placeholder="Select Chapter" />
                </SelectTrigger>
                <SelectContent className="max-h-96">
                  {loadingChapters ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                        Loading chapters...
                      </div>
                    </SelectItem>
                  ) : chapters.length === 0 ? (
                    <SelectItem value="no-chapters" disabled>
                      No chapters found
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

              {/* Selected Chapter Info */}
              {selectedChapter && (
                <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Selected Chapter:
                  </p>
                  <div className="text-sm">
                    <p className="font-medium">{selectedChapter.name}</p>
                    <p className="text-gray-600">{selectedChapter.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedChapter.program_name} →{" "}
                      {selectedChapter.course_name} →{" "}
                      {selectedChapter.subject_name} → {selectedChapter.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Topic Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Topic"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded border-2 border-dashed flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      disabled={uploadingImage}
                    >
                      Remove Image
                    </Button>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Supported formats: JPEG, JPG, PNG, WebP
              </p>
            </div>

            {/* Topic Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Topic Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Plastid"
                required
              />
            </div>

            {/* Topic Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Topic Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Understanding Plastids"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Short Description *</Label>
              <Textarea
                id="description"
                value={form.short_des}
                onChange={(e) => handleChange("short_des", e.target.value)}
                placeholder="Enter short description"
                rows={3}
                required
              />
            </div>

            {/* Status Options */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Status Settings</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="draft-mode">Draft Mode</Label>
                  <p className="text-sm text-gray-500">
                    When enabled, topic is not visible to users
                  </p>
                </div>
                <Switch
                  id="draft-mode"
                  checked={form.is_draft}
                  onCheckedChange={(checked) => {
                    handleChange("is_draft", checked);
                    if (checked) {
                      handleChange("is_published", false);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="publish-mode">Publish Status</Label>
                  <p className="text-sm text-gray-500">
                    When enabled, topic is visible to users
                  </p>
                </div>
                <Switch
                  id="publish-mode"
                  checked={form.is_published}
                  onCheckedChange={(checked) => {
                    handleChange("is_published", checked);
                    if (checked) {
                      handleChange("is_draft", false);
                    }
                  }}
                />
              </div>

              {/* Status Summary */}
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium mb-2">Current Status:</p>
                <div className="flex gap-2">
                  <Badge
                    variant={form.is_draft ? "default" : "outline"}
                    className={
                      form.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
                    }
                  >
                    Draft: {form.is_draft ? "Yes" : "No"}
                  </Badge>
                  <Badge
                    variant={form.is_published ? "default" : "outline"}
                    className={
                      form.is_published ? "bg-green-500 hover:bg-green-600" : ""
                    }
                  >
                    Published: {form.is_published ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading || uploadingImage}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || uploadingImage || loadingChapters}
              className="min-w-20"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
