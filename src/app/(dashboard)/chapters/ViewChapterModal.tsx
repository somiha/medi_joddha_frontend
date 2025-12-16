// app/courses/chapters/ViewChapterModal.tsx
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
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import Image from "next/image";
import type { ChapterWithSubject } from "./types";

const BASE_URL = "https://medijoddha.save71.net";

// Image Viewer Component
function ChapterImageViewer({
  src,
  alt,
}: {
  src: string | null | undefined;
  alt: string;
}) {
  if (!src) return null;

  return (
    <div className="mt-2">
      <div className="relative w-full max-h-96 aspect-video bg-gray-50 rounded-lg border flex items-center justify-center">
        <Image
          src={src}
          alt={alt}
          width={800}
          height={400}
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

export function ViewChapterModal({ chapter }: { chapter: ChapterWithSubject }) {
  const [isOpen, setIsOpen] = useState(false);
  const [subjectDetails, setSubjectDetails] = useState<{
    name: string;
    title: string;
    course_name?: string;
    program_name?: string;
  } | null>(null);
  const [loadingSubject, setLoadingSubject] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    await fetchSubjectDetails();
  };

  const fetchSubjectDetails = async () => {
    if (!chapter.subject_id) return;

    setLoadingSubject(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Fetch subject details
      const subjectRes = await fetch(
        `${BASE_URL}/api/subjects/${chapter.subject_id}`,
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
          // Try to get course and program info
          let course_name = `Course #${subject.course_id}`;
          let program_name = "Unknown Program";

          try {
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
              course_name = courseData.course?.name || course_name;

              if (courseData.course?.program_id) {
                const programRes = await fetch(
                  `${BASE_URL}/api/programs/${courseData.course.program_id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                if (programRes.ok) {
                  const programData = await programRes.json();
                  program_name = programData.program?.name || program_name;
                }
              }
            }
          } catch (err) {
            console.error("Error fetching hierarchy:", err);
          }

          setSubjectDetails({
            name: subject.name,
            title: subject.title,
            course_name,
            program_name,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch subject details:", err);
    } finally {
      setLoadingSubject(false);
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Chapter #{chapter.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Badges */}
            <div className="flex gap-2">
              <Badge
                variant={chapter.is_draft ? "default" : "outline"}
                className={
                  chapter.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
                }
              >
                {chapter.is_draft ? "Draft" : "Not Draft"}
              </Badge>
              <Badge
                variant={chapter.is_published ? "default" : "outline"}
                className={
                  chapter.is_published ? "bg-green-500 hover:bg-green-600" : ""
                }
              >
                {chapter.is_published ? "Published" : "Not Published"}
              </Badge>
            </div>

            {/* Chapter Image */}
            {chapter.image && (
              <div>
                <Label className="text-sm font-medium">Chapter Image</Label>
                <ChapterImageViewer src={chapter.image} alt={chapter.name} />
              </div>
            )}

            {/* Serial ID */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Serial ID</Label>
              <div className="p-2 bg-gray-50 rounded-md border">
                <p className="font-medium">{chapter.serial_id}</p>
              </div>
            </div>

            {/* Subject Info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Parent Subject</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {loadingSubject ? (
                  <p>Loading subject details...</p>
                ) : subjectDetails ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="font-medium">{subjectDetails.name}</p>
                      <Badge variant="outline" className="text-xs">
                        ID: {chapter.subject_id}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {subjectDetails.title}
                    </p>
                    {subjectDetails.course_name &&
                      subjectDetails.program_name && (
                        <div className="pt-2 border-t mt-2">
                          <p className="text-xs text-gray-500">
                            {subjectDetails.program_name} →{" "}
                            {subjectDetails.course_name} → {subjectDetails.name}
                          </p>
                        </div>
                      )}
                  </div>
                ) : (
                  <p>Subject ID: {chapter.subject_id}</p>
                )}
              </div>
            </div>

            {/* Chapter Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Chapter Name</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">{chapter.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Chapter Title</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">{chapter.title}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="whitespace-pre-wrap">{chapter.short_des}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {chapter.createdAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Created At</Label>
                  <p>{new Date(chapter.createdAt).toLocaleString()}</p>
                </div>
              )}
              {chapter.updatedAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Updated At</Label>
                  <p>{new Date(chapter.updatedAt).toLocaleString()}</p>
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
