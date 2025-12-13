// app/courses/subjects/EditSubjectModal.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Pencil, Upload } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Subject } from "./types";

const BASE_URL = "https://medijoddha.save71.net";

export function EditSubjectModal({ subject }: { subject: Subject }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<Subject>(subject);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    subject.image || null
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setForm(subject);
    setImagePreview(subject.image || null);
  };

  const handleChange = <K extends keyof Subject>(key: K, value: Subject[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    formData.append("name", form.name);
    formData.append("title", form.title);
    formData.append("short_des", form.short_des);
    formData.append("is_draft", form.is_draft.toString());
    formData.append("is_published", form.is_published.toString());

    try {
      const res = await fetch(`${BASE_URL}/api/subjects/${subject.id}`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.subject?.image) {
          const newImageUrl = `${data.subject.image}?t=${Date.now()}`;
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

      const res = await fetch(`${BASE_URL}/api/subjects/${subject.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Subject updated successfully!");
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
      handleChange("image", null);
      setImagePreview(null);
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
        <Pencil className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subject #{subject.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Subject Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Subject"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded border-2 border-dashed flex items-center justify-center">
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
                  {imagePreview && (
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

            {/* Subject Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Biology 1st Paper"
                required
              />
            </div>

            {/* Subject Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Subject Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Biology 1st Paper Botany"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Short Description *</Label>
              <Textarea
                id="description"
                value={form.short_des}
                onChange={(e) => handleChange("short_des", e.target.value)}
                placeholder="Enter short description"
                rows={3}
                required
              />
            </div>

            {/* Status Options */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Status Settings</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="draft-mode">Draft Mode</Label>
                  <p className="text-sm text-gray-500">
                    When enabled, subject is not visible to users
                  </p>
                </div>
                <Switch
                  id="draft-mode"
                  checked={form.is_draft}
                  onCheckedChange={(checked) => {
                    handleChange("is_draft", checked);
                    if (checked) {
                      handleChange("is_published", false);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="publish-mode">Publish Status</Label>
                  <p className="text-sm text-gray-500">
                    When enabled, subject is visible to users
                  </p>
                </div>
                <Switch
                  id="publish-mode"
                  checked={form.is_published}
                  onCheckedChange={(checked) => {
                    handleChange("is_published", checked);
                    if (checked) {
                      handleChange("is_draft", false);
                    }
                  }}
                />
              </div>

              {/* Status Summary */}
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium mb-2">Current Status:</p>
                <div className="flex gap-2">
                  <Badge
                    variant={form.is_draft ? "default" : "outline"}
                    className={
                      form.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
                    }
                  >
                    Draft: {form.is_draft ? "Yes" : "No"}
                  </Badge>
                  <Badge
                    variant={form.is_published ? "default" : "outline"}
                    className={
                      form.is_published ? "bg-green-500 hover:bg-green-600" : ""
                    }
                  >
                    Published: {form.is_published ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
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
              disabled={loading || uploadingImage}
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
