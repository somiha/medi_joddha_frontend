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
import { Upload } from "lucide-react";

const BASE_URL = "https://medijoddha.save71.net";

interface Subject {
  id: number;
  name: string;
  title: string;
  short_des: string;
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

interface SubjectWithHierarchy extends Subject {
  course_name: string;
  program_name: string;
}

export default function AddBookReferencePage() {
  const [subjectId, setSubjectId] = useState<string>("");
  const [name, setName] = useState("");

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
      const [subjectsRes, coursesRes, programsRes] = await Promise.all([
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

      if (!subjectsRes.ok || !coursesRes.ok || !programsRes.ok) {
        throw new Error("One or more API requests failed");
      }

      const subjectsData = await subjectsRes.json();
      const coursesData = await coursesRes.json();
      const programsData = await programsRes.json();

      const subjectsList = subjectsData.subjects || subjectsData.data || [];
      const coursesList = coursesData.courses || coursesData.data || [];
      const programsList = programsData.programs || programsData.data || [];

      const courseMap = new Map<number, Course>();
      coursesList.forEach((course: Course) => courseMap.set(course.id, course));

      const programMap = new Map<number, Program>();
      programsList.forEach((program: Program) =>
        programMap.set(program.id, program)
      );

      const enrichedSubjects: SubjectWithHierarchy[] = subjectsList.map(
        (subject: Subject) => {
          const course = subject.course_id
            ? courseMap.get(subject.course_id)
            : undefined;
          const program = course?.program_id
            ? programMap.get(course.program_id)
            : undefined;

          return {
            ...subject,
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
    if (!name.trim()) newErrors.name = "Book reference name is required";
    if (!imageFile) newErrors.image = "Image is required";

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

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(`${BASE_URL}/api/book-refs`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.ok && result.book_ref) {
        alert("Book reference added successfully!");
        router.push("/book-refs");
      } else {
        alert(result.message || "Failed to add book reference");
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
        <h1 className="text-2xl font-bold">Add New Book Reference</h1>
        <Button variant="outline" onClick={() => router.push("/book-refs")}>
          ← Back to Book References
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
                Select the subject for this book reference
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

          {/* Image Upload */}
          <div className="space-y-3">
            <Label>Book Cover Image *</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-48 h-64 rounded-lg overflow-hidden border-2 shadow-md">
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
                  className="w-48 h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
                  onClick={triggerFileSelect}
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 text-center px-4">
                    Click to upload book cover image
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Recommended: 3:4 aspect ratio
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
            {errors.image && (
              <p className="text-red-500 text-sm">{errors.image}</p>
            )}
            <p className="text-xs text-gray-500">
              Supported formats: JPEG, JPG, PNG, WebP
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Book Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Biology 1st Paper (Mazeda)"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
            <p className="text-xs text-gray-500">
              Enter the name of the reference book
            </p>
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
                "Save Book Reference"
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
