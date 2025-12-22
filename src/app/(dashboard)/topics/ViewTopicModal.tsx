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
import type { TopicWithHierarchy } from "./types";

const BASE_URL = "https://medijoddha.save71.net";

// Image Viewer Component
function TopicImageViewer({
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

interface ChapterDetails {
  id: number;
  name: string;
  title: string;
  subject_id: number;
  subject_name?: string;
  subject_title?: string;
  course_name?: string;
  program_name?: string;
}

export function ViewTopicModal({ topic }: { topic: TopicWithHierarchy }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chapterDetails, setChapterDetails] = useState<ChapterDetails | null>(
    null
  );
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    await fetchHierarchyDetails();
  };

  const fetchHierarchyDetails = async () => {
    if (!topic.chapter_id) return;

    setLoadingHierarchy(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Fetch chapter details
      const chapterRes = await fetch(
        `${BASE_URL}/api/chapters/${topic.chapter_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (chapterRes.ok) {
        const chapterData = await chapterRes.json();
        const chapter = chapterData.chapter;

        if (chapter) {
          const details: ChapterDetails = {
            id: chapter.id,
            name: chapter.name,
            title: chapter.title,
            subject_id: chapter.subject_id,
          };

          // Fetch subject details
          try {
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
                details.subject_name = subject.name;
                details.subject_title = subject.title;

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
              }
            }
          } catch (err) {
            console.error("Error fetching hierarchy:", err);
          }

          setChapterDetails(details);
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Topic #{topic.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Badges */}
            <div className="flex gap-2">
              <Badge
                variant={topic.is_draft ? "default" : "outline"}
                className={
                  topic.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
                }
              >
                {topic.is_draft ? "Draft" : "Not Draft"}
              </Badge>
              <Badge
                variant={topic.is_published ? "default" : "outline"}
                className={
                  topic.is_published ? "bg-green-500 hover:bg-green-600" : ""
                }
              >
                {topic.is_published ? "Published" : "Not Published"}
              </Badge>
            </div>

            {/* Topic Image */}
            {topic.image && (
              <div>
                <Label className="text-sm font-medium">Topic Image</Label>
                <TopicImageViewer src={topic.image} alt={topic.name} />
              </div>
            )}

            {/* Hierarchy Info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Hierarchy</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {loadingHierarchy ? (
                  <p>Loading hierarchy details...</p>
                ) : chapterDetails ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium mb-1">Chapter:</p>
                      <div className="pl-4">
                        <p className="font-medium">{chapterDetails.name}</p>
                        <p className="text-sm text-gray-600">
                          {chapterDetails.title}
                        </p>
                      </div>
                    </div>

                    {chapterDetails.subject_name && (
                      <div>
                        <p className="font-medium mb-1">Subject:</p>
                        <div className="pl-4">
                          <p>{chapterDetails.subject_name}</p>
                          <p className="text-sm text-gray-600">
                            {chapterDetails.subject_title}
                          </p>
                        </div>
                      </div>
                    )}

                    {chapterDetails.course_name && (
                      <div>
                        <p className="font-medium mb-1">Course:</p>
                        <p className="pl-4">{chapterDetails.course_name}</p>
                      </div>
                    )}

                    {chapterDetails.program_name && (
                      <div>
                        <p className="font-medium mb-1">Program:</p>
                        <p className="pl-4">{chapterDetails.program_name}</p>
                      </div>
                    )}

                    {/* Full Path */}
                    {chapterDetails.program_name &&
                      chapterDetails.course_name &&
                      chapterDetails.subject_name && (
                        <div className="pt-2 border-t mt-2">
                          <p className="text-xs text-gray-500">
                            {chapterDetails.program_name} →{" "}
                            {chapterDetails.course_name} →{" "}
                            {chapterDetails.subject_name} →{" "}
                            {chapterDetails.name}
                          </p>
                        </div>
                      )}
                  </div>
                ) : (
                  <p>Chapter ID: {topic.chapter_id}</p>
                )}
              </div>
            </div>

            {/* Topic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Topic Name</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">{topic.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Topic Title</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">{topic.title}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="whitespace-pre-wrap">{topic.short_des}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {topic.createdAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Created At</Label>
                  <p>{new Date(topic.createdAt).toLocaleString()}</p>
                </div>
              )}
              {topic.updatedAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Updated At</Label>
                  <p>{new Date(topic.updatedAt).toLocaleString()}</p>
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
