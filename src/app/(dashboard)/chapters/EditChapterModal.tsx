// app/courses/chapters/EditChapterModal.tsx
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
import type { ChapterWithSubject } from "./types";

const BASE_URL = "https://medijoddha.save71.net";

// Interfaces
interface Subject {
  id: number;
  name: string;
  title: string;
  short_des: string;
  is_draft: boolean;
  is_published: boolean;
  image?: string;
}

interface Course {
  id: number;
  name: string;
  title: string;
  program_id?: number;
}

interface Program {
  id: number;
  name: string;
}

interface CourseSubjectMapping {
  id: number;
  course_id: number;
  subject_id: number;
}

interface SubjectWithHierarchy extends Subject {
  course_name: string;
  program_name: string;
  course_id?: number;
}

// Response wrappers
interface SubjectsResponse {
  subjects?: Subject[];
  data?: Subject[];
}

interface CourseSubjectResponse {
  mappings?: CourseSubjectMapping[];
  data?: CourseSubjectMapping[];
}

interface CoursesResponse {
  courses?: Course[];
  data?: Course[];
}

interface ProgramsResponse {
  programs?: Program[];
  data?: Program[];
}

export function EditChapterModal({ chapter }: { chapter: ChapterWithSubject }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ChapterWithSubject>(chapter);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    chapter.image || null
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [subjects, setSubjects] = useState<SubjectWithHierarchy[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    await fetchSubjectsWithHierarchy();
  };

  const fetchSubjectsWithHierarchy = async () => {
    setLoadingSubjects(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      setLoadingSubjects(false);
      return;
    }

    try {
      // Fetch all data in parallel
      const [subjectsRes, courseSubjectRes, coursesRes, programsRes] =
        await Promise.all([
          fetch(`${BASE_URL}/api/subjects?page=1&limit=100`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}/api/course-subject?page=1&limit=500`, {
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
        !subjectsRes.ok ||
        !coursesRes.ok ||
        !programsRes.ok ||
        !courseSubjectRes.ok
      ) {
        throw new Error("One or more API requests failed");
      }

      // Parse responses
      const subjectsData = (await subjectsRes.json()) as SubjectsResponse;
      const courseSubjectData =
        (await courseSubjectRes.json()) as CourseSubjectResponse;
      const coursesData = (await coursesRes.json()) as CoursesResponse;
      const programsData = (await programsRes.json()) as ProgramsResponse;

      // Extract data
      const subjectsList = subjectsData.subjects || subjectsData.data || [];
      const courseSubjectList =
        courseSubjectData.mappings || courseSubjectData.data || [];
      const coursesList = coursesData.courses || coursesData.data || [];
      const programsList = programsData.programs || programsData.data || [];

      // Build lookup maps
      const courseMap = new Map<number, Course>();
      coursesList.forEach((course) => courseMap.set(course.id, course));

      const programMap = new Map<number, Program>();
      programsList.forEach((program) => programMap.set(program.id, program));

      const subjectToCourseMap = new Map<number, number>();
      courseSubjectList.forEach((mapping) => {
        subjectToCourseMap.set(mapping.subject_id, mapping.course_id);
      });

      // Enrich subjects with course and program names
      const enrichedSubjects: SubjectWithHierarchy[] = subjectsList.map(
        (subject) => {
          const course_id = subjectToCourseMap.get(subject.id);
          const course = course_id ? courseMap.get(course_id) : undefined;
          const program = course?.program_id
            ? programMap.get(course.program_id)
            : undefined;

          return {
            ...subject,
            course_id,
            course_name: course?.name || "No Course Assigned",
            program_name: program?.name || "No Program",
          };
        }
      );

      setSubjects(enrichedSubjects);
    } catch (err) {
      console.error("Failed to fetch subject hierarchy:", err);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleChange = <K extends keyof ChapterWithSubject>(
    key: K,
    value: ChapterWithSubject[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubjectChange = (subjectId: string) => {
    handleChange("subject_id", parseInt(subjectId));
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
    formData.append("subject_id", form.subject_id.toString());
    formData.append("name", form.name);
    formData.append("title", form.title);
    formData.append("short_des", form.short_des);
    formData.append("serial_id", form.serial_id.toString());
    formData.append("is_draft", form.is_draft.toString());
    formData.append("is_published", form.is_published.toString());

    try {
      const res = await fetch(`${BASE_URL}/api/chapters/${chapter.id}`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.chapter?.image) {
          const newImageUrl = `${data.chapter.image}?t=${Date.now()}`;
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

      const res = await fetch(`${BASE_URL}/api/chapters/${chapter.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject_id: form.subject_id,
          name: form.name,
          title: form.title,
          short_des: form.short_des,
          serial_id: form.serial_id,
          is_draft: form.is_draft,
          is_published: form.is_published,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Chapter updated successfully!");
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

  // Group subjects by program → course
  const subjectsByHierarchy = subjects.reduce((acc, subject) => {
    const programKey = subject.program_name;
    const courseKey = subject.course_name;

    if (!acc[programKey]) acc[programKey] = {};
    if (!acc[programKey][courseKey]) acc[programKey][courseKey] = [];

    acc[programKey][courseKey].push(subject);
    return acc;
  }, {} as Record<string, Record<string, SubjectWithHierarchy[]>>);

  // Get selected subject info
  const selectedSubject = subjects.find(
    (subject) => subject.id === form.subject_id
  );

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
            <DialogTitle>Edit Chapter #{chapter.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Subject Selection */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select
                value={form.subject_id.toString()}
                onValueChange={handleSubjectChange}
                disabled={loadingSubjects}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="max-h-96">
                  {loadingSubjects ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                        Loading subjects...
                      </div>
                    </SelectItem>
                  ) : subjects.length === 0 ? (
                    <SelectItem value="no-subjects" disabled>
                      No subjects found
                    </SelectItem>
                  ) : (
                    Object.entries(subjectsByHierarchy).map(
                      ([programName, courses]) => (
                        <div key={programName}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 border-b">
                            📚 {programName}
                          </div>
                          {Object.entries(courses).map(
                            ([courseName, courseSubjects]) => (
                              <div key={courseName}>
                                <div className="px-4 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border-b">
                                  📁 {courseName}
                                </div>
                                {courseSubjects.map((subject) => (
                                  <SelectItem
                                    key={subject.id}
                                    value={subject.id.toString()}
                                    className="pl-8"
                                  >
                                    <div className="flex flex-col">
                                      <div className="flex justify-between items-start">
                                        <span className="font-medium">
                                          {subject.name}
                                        </span>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded ml-2">
                                          ID: {subject.id}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500 mt-1 line-clamp-1">
                                        {subject.title}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      )
                    )
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Select the parent subject for this chapter
              </p>

              {/* Selected Subject Info */}
              {selectedSubject && (
                <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Selected Subject:
                  </p>
                  <div className="text-sm">
                    <p className="font-medium">{selectedSubject.name}</p>
                    <p className="text-gray-600">{selectedSubject.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedSubject.program_name} →{" "}
                      {selectedSubject.course_name} → {selectedSubject.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Serial ID */}
            <div className="space-y-2">
              <Label htmlFor="serial_id">Serial ID *</Label>
              <Input
                id="serial_id"
                type="number"
                min="1"
                value={form.serial_id}
                onChange={(e) =>
                  handleChange("serial_id", parseInt(e.target.value) || 1)
                }
                placeholder="e.g., 1"
                required
              />
              <p className="text-xs text-gray-500">
                Chapter order number (must be unique per subject)
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Chapter Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Chapter"
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

            {/* Chapter Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Chapter Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Animals"
                required
              />
            </div>

            {/* Chapter Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Chapter Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Introduction to Animals"
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
                    When enabled, chapter is not visible to users
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
                    When enabled, chapter is visible to users
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
              disabled={loading || uploadingImage || loadingSubjects}
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
