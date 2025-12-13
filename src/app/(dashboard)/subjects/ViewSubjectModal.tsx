// app/courses/subjects/ViewSubjectModal.tsx
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
import type { Subject } from "./types";
import type { CourseItem } from "../courses/types";

const BASE_URL = "https://medijoddha.save71.net";

// Image Viewer Component
function SubjectImageViewer({
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

export function ViewSubjectModal({ subject }: { subject: Subject }) {
  const [isOpen, setIsOpen] = useState(false);
  const [linkedCourse, setLinkedCourse] = useState<CourseItem | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    // Fetch linked course if available
    if (subject.course_id) {
      await fetchLinkedCourse(subject.course_id);
    }
  };

  const fetchLinkedCourse = async (courseId: number) => {
    setLoadingCourse(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${BASE_URL}/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLinkedCourse(data.course);
      }
    } catch (err) {
      console.error("Failed to fetch course:", err);
    } finally {
      setLoadingCourse(false);
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
            <DialogTitle>View Subject #{subject.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Badges */}
            <div className="flex gap-2">
              <Badge
                variant={subject.is_draft ? "default" : "outline"}
                className={
                  subject.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
                }
              >
                {subject.is_draft ? "Draft" : "Not Draft"}
              </Badge>
              <Badge
                variant={subject.is_published ? "default" : "outline"}
                className={
                  subject.is_published ? "bg-green-500 hover:bg-green-600" : ""
                }
              >
                {subject.is_published ? "Published" : "Not Published"}
              </Badge>
            </div>

            {/* Subject Image */}
            {subject.image && (
              <div>
                <Label className="text-sm font-medium">Subject Image</Label>
                <SubjectImageViewer src={subject.image} alt={subject.name} />
              </div>
            )}

            {/* Linked Course */}
            {subject.course_id && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Linked Course</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">
                    {loadingCourse
                      ? "Loading..."
                      : linkedCourse
                      ? `${linkedCourse.name} (ID: ${linkedCourse.id})`
                      : `Course ID: ${subject.course_id}`}
                  </p>
                </div>
              </div>
            )}

            {/* Subject Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Subject Name</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">{subject.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Subject Title</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">{subject.title}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="whitespace-pre-wrap">{subject.short_des}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {subject.createdAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Created At</Label>
                  <p>{new Date(subject.createdAt).toLocaleString()}</p>
                </div>
              )}
              {subject.updatedAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Updated At</Label>
                  <p>{new Date(subject.updatedAt).toLocaleString()}</p>
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
