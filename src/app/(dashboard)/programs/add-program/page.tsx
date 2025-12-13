// app/programs/add-program/page.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload } from "lucide-react";

const BASE_URL = "https://medijoddha.save71.net";

export default function AddProgramPage() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [short_des, setShortDes] = useState("");
  const [is_draft, setIsDraft] = useState(false);
  const [is_published, setIsPublished] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
    if (!name.trim()) newErrors.name = "Program name is required";
    if (!title.trim()) newErrors.title = "Program title is required";

    // Ensure draft and published aren't both true
    if (is_draft && is_published) {
      newErrors.status = "Program cannot be both draft and published";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("title", title);
      if (short_des) formData.append("short_des", short_des);
      formData.append("is_draft", is_draft.toString());
      formData.append("is_published", is_published.toString());

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(`${BASE_URL}/api/programs`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.program) {
        alert("Program added successfully!");
        router.push("/programs");
      } else {
        alert(result.message || "Failed to add program");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setName("");
    setTitle("");
    setShortDes("");
    setIsDraft(false);
    setIsPublished(false);
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add New Program</h1>
        <Button variant="outline" onClick={() => router.push("/programs")}>
          ← Back to Programs
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label>Program Image (Optional)</Label>
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
            <Label htmlFor="name">Program Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Medical Admission"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">Program Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Medical Admission Course"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Short Description (Optional)</Label>
            <Textarea
              id="description"
              value={short_des}
              onChange={(e) => setShortDes(e.target.value)}
              placeholder="Enter a brief description of the program"
              rows={4}
            />
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
                  Make program visible to users immediately
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
                  ? "⚠️ Program cannot be both draft and published"
                  : is_draft
                  ? "Program will be saved as draft (not visible to users)"
                  : is_published
                  ? "Program will be published immediately"
                  : "Program will be saved with no status set"}
              </p>
            </div>
          </div>

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
                "Save Program"
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
