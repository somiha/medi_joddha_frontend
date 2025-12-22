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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Upload } from "lucide-react";
import Image from "next/image";
import type { BookReferenceWithHierarchy } from "./types";

const BASE_URL = "https://medijoddha.save71.net";

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

interface SubjectWithHierarchy extends Subject {
  course_name: string;
  program_name: string;
}

export function EditBookReferenceModal({
  bookRef,
}: {
  bookRef: BookReferenceWithHierarchy;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<BookReferenceWithHierarchy>({
    ...bookRef,
    image: bookRef.image || "",
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    bookRef.image || null
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
      setLoadingSubjects(false);
    }
  };

  const handleChange = <K extends keyof BookReferenceWithHierarchy>(
    key: K,
    value: BookReferenceWithHierarchy[K]
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

    try {
      const res = await fetch(`${BASE_URL}/api/book-refs/${bookRef.id}`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.book_ref?.image) {
          const newImageUrl = `${data.book_ref.image}?t=${Date.now()}`;
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

      const res = await fetch(`${BASE_URL}/api/book-refs/${bookRef.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject_id: form.subject_id,
          name: form.name,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Book reference updated successfully!");
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
      handleChange("image", "");
      setImagePreview(null);
    }
  };

  // Get selected subject info
  const selectedSubject = subjects.find(
    (subject) => subject.id === form.subject_id
  );

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
            <DialogTitle>Edit Book Reference #{bookRef.id}</DialogTitle>
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

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Book Cover Image</Label>
              <div className="flex items-center gap-4">
                {(imagePreview || form.image) && form.image !== "" ? (
                  <div className="relative w-32 h-40 rounded overflow-hidden border shadow-sm">
                    <Image
                      src={imagePreview || (form.image as string)}
                      alt="Book Cover"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-32 h-40 bg-gray-100 rounded border-2 border-dashed flex items-center justify-center">
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
                  {(imagePreview || form.image) && form.image !== "" && (
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

            {/* Book Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Book Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Biology 1st Paper (Mazeda)"
                required
              />
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
