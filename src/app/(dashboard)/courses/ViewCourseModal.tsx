// app/courses/ViewCourseModal.tsx
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
import type { CourseItem } from "./types";
import type { ProgramOption } from "./types";

const BASE_URL = "https://medijoddha.save71.net";

// Image Viewer Component
function ImageViewer({
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

export function ViewCourseModal({ course }: { course: CourseItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const fetchPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/programs?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
      }
    } catch (err) {
      console.error("Failed to fetch programs:", err);
    } finally {
      setLoadingPrograms(false);
    }
  };
  const handleOpen = async () => {
    setIsOpen(true);
    // Fetch programs only when modal opens
    await fetchPrograms();
  };

  const programName =
    programs.find((p) => p.id === course.program_id)?.name || "Unknown Program";

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
            <DialogTitle>View Course #{course.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Badges */}
            <div className="flex gap-2">
              <Badge
                variant={course.is_draft ? "default" : "outline"}
                className={
                  course.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
                }
              >
                {course.is_draft ? "Draft" : "Not Draft"}
              </Badge>
              <Badge
                variant={course.is_published ? "default" : "outline"}
                className={
                  course.is_published ? "bg-green-500 hover:bg-green-600" : ""
                }
              >
                {course.is_published ? "Published" : "Not Published"}
              </Badge>
            </div>

            {/* Course Image */}
            {course.image && (
              <div>
                <Label className="text-sm font-medium">Course Image</Label>
                <ImageViewer src={course.image} alt={course.name} />
              </div>
            )}

            {/* Course Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Program</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">
                    {loadingPrograms ? "Loading..." : programName}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Course Name</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">{course.name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Course Title</Label>
              <div className="p-2 bg-gray-50 rounded-md border">
                <p className="font-medium">{course.title}</p>
              </div>
            </div>

            {/* Description */}
            {course.short_des && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="whitespace-pre-wrap">{course.short_des}</p>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {course.createdAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Created At</Label>
                  <p>{new Date(course.createdAt).toLocaleString()}</p>
                </div>
              )}
              {course.updatedAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Updated At</Label>
                  <p>{new Date(course.updatedAt).toLocaleString()}</p>
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
