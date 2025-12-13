// app/courses/subjects/add-subject/page.tsx
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
import type { CourseItem, ProgramOption } from "../../courses/types";

const BASE_URL = "https://medijoddha.save71.net";

// Interface for course with program details
interface CourseWithProgram extends CourseItem {
  program_name?: string;
  program_title?: string;
}

export default function AddSubjectPage() {
  const [courseId, setCourseId] = useState<string>("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [short_des, setShortDes] = useState("");
  const [is_draft, setIsDraft] = useState(false);
  const [is_published, setIsPublished] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [courses, setCourses] = useState<CourseWithProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch courses and programs on mount
  useEffect(() => {
    fetchCoursesAndPrograms();
  }, []);

  const fetchCoursesAndPrograms = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        setLoading(false);
        return;
      }

      // Step 1: Fetch programs first
      const programsRes = await fetch(
        `${BASE_URL}/api/programs?page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      let programsData: ProgramOption[] = [];
      if (programsRes.ok) {
        const data = await programsRes.json();
        programsData = data.programs || [];
      }

      // Step 2: Fetch courses
      const coursesRes = await fetch(
        `${BASE_URL}/api/courses?page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const coursesList = coursesData.courses || [];

        // Step 3: Enrich courses with program names using the fetched programs
        const enrichedCourses = coursesList.map((course: CourseItem) => {
          const program = programsData.find((p) => p.id === course.program_id);
          return {
            ...course,
            program_name: program?.name || `Program #${course.program_id}`,
            program_title: program?.title || "",
          };
        });

        setCourses(enrichedCourses);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
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
    if (!courseId) newErrors.courseId = "Course selection is required";
    if (!name.trim()) newErrors.name = "Subject name is required";
    if (!title.trim()) newErrors.title = "Subject title is required";
    if (!short_des.trim())
      newErrors.short_des = "Short description is required";

    if (is_draft && is_published) {
      newErrors.status = "Subject cannot be both draft and published";
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

      // Step 1: Create the subject
      const formData = new FormData();
      formData.append("name", name);
      formData.append("title", title);
      formData.append("short_des", short_des);
      formData.append("is_draft", is_draft.toString());
      formData.append("is_published", is_published.toString());

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const subjectRes = await fetch(`${BASE_URL}/api/subjects`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const subjectResult = await subjectRes.json();

      if (subjectRes.ok && subjectResult.subject) {
        const subjectId = subjectResult.subject.id;

        // Step 2: Link subject to course
        const linkData = {
          course_id: parseInt(courseId),
          subject_id: subjectId,
        };

        const linkRes = await fetch(`${BASE_URL}/api/course-subject`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(linkData),
        });

        if (linkRes.ok) {
          alert("Subject added and linked to course successfully!");
          router.push("/courses/subjects");
        } else {
          // If linking fails, we should delete the subject or show error
          const linkError = await linkRes.json();
          alert(
            `Subject created but linking failed: ${
              linkError.message || "Unknown error"
            }`
          );
        }
      } else {
        alert(subjectResult.message || "Failed to add subject");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setCourseId("");
    setName("");
    setTitle("");
    setShortDes("");
    setIsDraft(false);
    setIsPublished(false);
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
  };

  // Group courses by program for better organization
  const coursesByProgram = courses.reduce((acc, course) => {
    const programKey = course.program_name || `Program #${course.program_id}`;
    if (!acc[programKey]) {
      acc[programKey] = [];
    }
    acc[programKey].push(course);
    return acc;
  }, {} as Record<string, CourseWithProgram[]>);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add New Subject</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/courses/subjects")}
        >
          ← Back to Subjects
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">Course *</Label>
            <Select
              value={courseId}
              onValueChange={setCourseId}
              disabled={loading}
            >
              <SelectTrigger
                id="course"
                className={errors.courseId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent className="max-h-96">
                {loading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      Loading courses...
                    </div>
                  </SelectItem>
                ) : courses.length === 0 ? (
                  <SelectItem value="no-courses" disabled>
                    No courses found. Please create a course first.
                  </SelectItem>
                ) : (
                  // Group courses by program
                  Object.entries(coursesByProgram).map(
                    ([programName, programCourses]) => (
                      <div key={programName}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                          {programName}
                        </div>
                        {programCourses.map((course) => (
                          <SelectItem
                            key={course.id}
                            value={course.id.toString()}
                            className="pl-6"
                          >
                            <div className="flex flex-col">
                              <div className="flex justify-between items-start">
                                <span className="font-medium">
                                  {course.name}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                                  {course.program_name}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 mt-1">
                                {course.title}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    )
                  )
                )}
              </SelectContent>
            </Select>
            {errors.courseId && (
              <p className="text-red-500 text-sm">{errors.courseId}</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Select the parent course for this subject
              </p>
              {courseId && (
                <div className="text-xs text-gray-600">
                  {(() => {
                    const selectedCourse = courses.find(
                      (c) => c.id.toString() === courseId
                    );
                    return selectedCourse ? (
                      <span>
                        Program:{" "}
                        <span className="font-medium">
                          {selectedCourse.program_name}
                        </span>
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label>Subject Image (Optional)</Label>
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

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Biology 1st Paper"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">Subject Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Biology 1st Paper Botany"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Short Description *</Label>
            <Textarea
              id="description"
              value={short_des}
              onChange={(e) => setShortDes(e.target.value)}
              placeholder="e.g., Chapter wise MCQ, board questions, test papers, school wise test papers, model tests"
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
                  Make subject visible to users immediately
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

            {/* Status Preview */}
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
                  ? "⚠️ Subject cannot be both draft and published"
                  : is_draft
                  ? "Subject will be saved as draft (not visible to users)"
                  : is_published
                  ? "Subject will be published immediately"
                  : "Subject will be saved with no status set"}
              </p>
            </div>
          </div>

          {/* Selected Course Info */}
          {courseId && (
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">
                Selected Course Info
              </h3>
              {(() => {
                const selectedCourse = courses.find(
                  (c) => c.id.toString() === courseId
                );
                if (!selectedCourse) return null;

                return (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Course Name:</p>
                        <p className="font-medium">{selectedCourse.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Course Title:</p>
                        <p className="font-medium">{selectedCourse.title}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Program:</p>
                        <p className="font-medium">
                          {selectedCourse.program_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Program Title:</p>
                        <p className="font-medium">
                          {selectedCourse.program_title}
                        </p>
                      </div>
                    </div>
                    {selectedCourse.short_des && (
                      <div>
                        <p className="text-gray-600">Course Description:</p>
                        <p className="line-clamp-2">
                          {selectedCourse.short_des}
                        </p>
                      </div>
                    )}
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
                "Save Subject"
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
