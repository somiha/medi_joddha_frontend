// app/chapters/add-chapter/page.tsx
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

// ✅ FIXED: Removed trailing spaces
const BASE_URL = "https://medijoddha.save71.net";

// --- Interfaces ---
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

// --- Response Wrappers (flexible for your API structure) ---
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

export default function AddChapterPage() {
  const [subjectId, setSubjectId] = useState<string>("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [short_des, setShortDes] = useState("");
  const [serial_id, setSerialId] = useState<number>(1);
  const [is_draft, setIsDraft] = useState(false);
  const [is_published, setIsPublished] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subjects, setSubjects] = useState<SubjectWithHierarchy[]>([]);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch all required data on mount
  useEffect(() => {
    fetchSubjectsWithHierarchy();
  }, []);

  const fetchSubjectsWithHierarchy = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      setLoading(false);
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

      // Extract data (support both `subjects` and `data` formats)
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
      // Optional: show toast or error banner
      setSubjects([]);
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
    if (!subjectId) newErrors.subjectId = "Subject selection is required";
    if (!name.trim()) newErrors.name = "Chapter name is required";
    if (!title.trim()) newErrors.title = "Chapter title is required";
    if (!short_des.trim())
      newErrors.short_des = "Short description is required";
    if (!serial_id || serial_id < 1)
      newErrors.serial_id = "Serial ID must be at least 1";
    if (is_draft && is_published) {
      newErrors.status = "Chapter cannot be both draft and published";
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
      formData.append("subject_id", subjectId);
      formData.append("name", name);
      formData.append("title", title);
      formData.append("short_des", short_des);
      formData.append("serial_id", serial_id.toString());
      formData.append("is_draft", is_draft.toString());
      formData.append("is_published", is_published.toString());
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(`${BASE_URL}/api/chapters`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.ok && result.chapter) {
        alert("Chapter added successfully!");
        router.push("/chapters");
      } else {
        alert(result.message || "Failed to add chapter");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setSubjectId("");
    setName("");
    setTitle("");
    setShortDes("");
    setSerialId(1);
    setIsDraft(false);
    setIsPublished(false);
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add New Chapter</h1>
        <Button variant="outline" onClick={() => router.push("/chapters")}>
          ← Back to Chapters
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Subject Selection */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select
              value={subjectId}
              onValueChange={setSubjectId}
              disabled={loading}
            >
              <SelectTrigger
                id="subject"
                className={errors.subjectId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent className="max-h-96">
                {loading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      Loading subjects...
                    </div>
                  </SelectItem>
                ) : subjects.length === 0 ? (
                  <SelectItem value="no-subjects" disabled>
                    No subjects found. Please create a subject first.
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
            {errors.subjectId && (
              <p className="text-red-500 text-sm">{errors.subjectId}</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Select the parent subject for this chapter
              </p>
              {subjectId && (
                <div className="text-xs text-gray-600">
                  {(() => {
                    const selectedSubject = subjects.find(
                      (s) => s.id.toString() === subjectId
                    );
                    return selectedSubject ? (
                      <span>
                        <span className="font-medium">
                          {selectedSubject.program_name} →{" "}
                          {selectedSubject.course_name} → {selectedSubject.name}
                        </span>
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Serial ID */}
          <div className="space-y-2">
            <Label htmlFor="serial_id">Serial ID *</Label>
            <Input
              id="serial_id"
              type="number"
              min="1"
              value={serial_id}
              onChange={(e) => setSerialId(parseInt(e.target.value) || 1)}
              placeholder="e.g., 1"
              className={errors.serial_id ? "border-red-500" : ""}
            />
            {errors.serial_id && (
              <p className="text-red-500 text-sm">{errors.serial_id}</p>
            )}
            <p className="text-xs text-gray-500">
              Chapter order number (must be unique per subject)
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <Label>Chapter Image (Optional)</Label>
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
            <Label htmlFor="name">Chapter Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Animals"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Chapter Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Animals"
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
              placeholder="e.g., Learn the structure of Animals"
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
                  Make chapter visible to users immediately
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
                  ? "⚠️ Chapter cannot be both draft and published"
                  : is_draft
                  ? "Chapter will be saved as draft (not visible to users)"
                  : is_published
                  ? "Chapter will be published immediately"
                  : "Chapter will be saved with no status set"}
              </p>
            </div>
          </div>

          {/* Selected Subject Info */}
          {subjectId && (
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">
                Selected Subject Info
              </h3>
              {(() => {
                const selectedSubject = subjects.find(
                  (s) => s.id.toString() === subjectId
                );
                if (!selectedSubject) return null;
                return (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Subject Name:</p>
                        <p className="font-medium">{selectedSubject.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Subject Title:</p>
                        <p className="font-medium">{selectedSubject.title}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Course:</p>
                        <p className="font-medium">
                          {selectedSubject.course_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Program:</p>
                        <p className="font-medium">
                          {selectedSubject.program_name}
                        </p>
                      </div>
                    </div>
                    {selectedSubject.short_des && (
                      <div>
                        <p className="text-gray-600">Subject Description:</p>
                        <p className="line-clamp-2">
                          {selectedSubject.short_des}
                        </p>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        {selectedSubject.program_name} →{" "}
                        {selectedSubject.course_name} → {selectedSubject.name}
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
                "Save Chapter"
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
