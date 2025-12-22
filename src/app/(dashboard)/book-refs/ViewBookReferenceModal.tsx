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
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import Image from "next/image";
import type { BookReferenceWithHierarchy } from "./types";

const BASE_URL = "https://medijoddha.save71.net";

// Image Viewer Component
function BookImageViewer({
  src,
  alt,
}: {
  src: string | null | undefined;
  alt: string;
}) {
  if (!src || src === "") return null;

  return (
    <div className="mt-2">
      <div className="relative w-48 h-64 mx-auto bg-gray-50 rounded-lg border shadow-md flex items-center justify-center">
        <Image
          src={src}
          alt={alt}
          width={192}
          height={256}
          className="object-contain max-w-full max-h-full"
          unoptimized
          onError={(e) => {
            console.error(`Failed to load image: ${src}`);
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    </div>
  );
}

interface SubjectDetails {
  id: number;
  name: string;
  title: string;
  course_name?: string;
  program_name?: string;
}

export function ViewBookReferenceModal({
  bookRef,
}: {
  bookRef: BookReferenceWithHierarchy;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [subjectDetails, setSubjectDetails] = useState<SubjectDetails | null>(
    null
  );
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    await fetchHierarchyDetails();
  };

  const fetchHierarchyDetails = async () => {
    if (!bookRef.subject_id) return;

    setLoadingHierarchy(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Fetch subject details
      const subjectRes = await fetch(
        `${BASE_URL}/api/subjects/${bookRef.subject_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (subjectRes.ok) {
        const subjectData = await subjectRes.json();
        const subject = subjectData.subject;

        if (subject) {
          const details: SubjectDetails = {
            id: subject.id,
            name: subject.name,
            title: subject.title,
          };

          // Fetch course details if subject has course_id
          if (subject.course_id) {
            const courseRes = await fetch(
              `${BASE_URL}/api/courses/${subject.course_id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (courseRes.ok) {
              const courseData = await courseRes.json();
              const course = courseData.course;
              if (course) {
                details.course_name = course.name;

                // Fetch program details if course has program_id
                if (course.program_id) {
                  const programRes = await fetch(
                    `${BASE_URL}/api/programs/${course.program_id}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    }
                  );

                  if (programRes.ok) {
                    const programData = await programRes.json();
                    const program = programData.program;
                    if (program) {
                      details.program_name = program.name;
                    }
                  }
                }
              }
            }
          }

          setSubjectDetails(details);
        }
      }
    } catch (err) {
      console.error("Failed to fetch hierarchy details:", err);
    } finally {
      setLoadingHierarchy(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={handleOpen}
      >
        <Eye className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Book Reference #{bookRef.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Book Image */}
            {bookRef.image && (
              <div className="flex justify-center">
                <BookImageViewer src={bookRef.image} alt={bookRef.name} />
              </div>
            )}

            {/* Book Details */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Book Name</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="font-medium text-lg">{bookRef.name}</p>
                </div>
              </div>
            </div>

            {/* Subject Info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subject Information</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {loadingHierarchy ? (
                  <p>Loading subject details...</p>
                ) : subjectDetails ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="font-medium">{subjectDetails.name}</p>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        ID: {bookRef.subject_id}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {subjectDetails.title}
                    </p>

                    {subjectDetails.course_name && (
                      <div className="pt-2 border-t mt-2">
                        <p className="text-sm font-medium mb-1">Course:</p>
                        <p>{subjectDetails.course_name}</p>
                      </div>
                    )}

                    {subjectDetails.program_name && (
                      <div className="pt-2">
                        <p className="text-sm font-medium mb-1">Program:</p>
                        <p>{subjectDetails.program_name}</p>
                      </div>
                    )}

                    {/* Full Path */}
                    {subjectDetails.program_name &&
                      subjectDetails.course_name && (
                        <div className="pt-2 border-t mt-2">
                          <p className="text-xs text-gray-500">
                            {subjectDetails.program_name} →{" "}
                            {subjectDetails.course_name} → {subjectDetails.name}
                          </p>
                        </div>
                      )}
                  </div>
                ) : (
                  <p>Subject ID: {bookRef.subject_id}</p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {bookRef.createdAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Created At</Label>
                  <p>{new Date(bookRef.createdAt).toLocaleString()}</p>
                </div>
              )}
              {bookRef.updatedAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Updated At</Label>
                  <p>{new Date(bookRef.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
