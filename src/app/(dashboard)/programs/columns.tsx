// app/programs/columns.tsx
"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash, Eye, Upload } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const BASE_URL = "https://medijoddha.save71.net";

export interface ProgramItem {
  id: number;
  name: string;
  title: string;
  short_des?: string | null;
  image?: string | null;
  is_draft: boolean;
  is_published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Thumbnail Component
function ImageThumb({
  src,
  alt,
}: {
  src: string | null | undefined;
  alt: string;
}) {
  if (!src) return <span className="text-gray-400">No image</span>;

  return (
    <div className="relative w-16 h-16 rounded overflow-hidden border">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="64px"
        className="object-cover"
        unoptimized
        onError={(e) => {
          console.error(`Failed to load image: ${src}`);
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

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

// View Program Modal
function ViewProgramModal({ program }: { program: ProgramItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => setIsOpen(true)}
      >
        <Eye className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Program #{program.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Badges */}
            <div className="flex gap-2">
              <Badge
                variant={program.is_draft ? "default" : "outline"}
                className={
                  program.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
                }
              >
                {program.is_draft ? "Draft" : "Not Draft"}
              </Badge>
              <Badge
                variant={program.is_published ? "default" : "outline"}
                className={
                  program.is_published ? "bg-green-500 hover:bg-green-600" : ""
                }
              >
                {program.is_published ? "Published" : "Not Published"}
              </Badge>
            </div>

            {/* Program Image */}
            {program.image && (
              <div>
                <Label className="text-sm font-medium">Program Image</Label>
                <ImageViewer src={program.image} alt={program.name} />
              </div>
            )}

            {/* Program Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">{program.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Title</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  <p className="font-medium">{program.title}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {program.short_des && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="whitespace-pre-wrap">{program.short_des}</p>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {program.createdAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Created At</Label>
                  <p>{new Date(program.createdAt).toLocaleString()}</p>
                </div>
              )}
              {program.updatedAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Updated At</Label>
                  <p>{new Date(program.updatedAt).toLocaleString()}</p>
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

// Edit Program Modal
function EditProgramModal({ program }: { program: ProgramItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ProgramItem>(program);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    program.image || null
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleChange = <K extends keyof ProgramItem>(
    key: K,
    value: ProgramItem[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("name", form.name);
    formData.append("title", form.title);
    formData.append("short_des", form.short_des || "");
    formData.append("is_draft", form.is_draft.toString());
    formData.append("is_published", form.is_published.toString());

    try {
      const res = await fetch(`${BASE_URL}/api/programs/${program.id}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.program?.image) {
          const newImageUrl = `${data.program.image}?t=${Date.now()}`;
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
      const res = await fetch(`${BASE_URL}/api/programs/${program.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Program updated successfully!");
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
        onClick={() => setIsOpen(true)}
      >
        <Pencil className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Program #{program.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Program Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Program"
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

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter program name"
                required
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter program title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                value={form.short_des || ""}
                onChange={(e) => handleChange("short_des", e.target.value)}
                placeholder="Enter short description"
                rows={3}
              />
            </div>

            {/* Status Options */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Status Settings</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="draft-mode">Draft Mode</Label>
                  <p className="text-sm text-gray-500">
                    When enabled, program is not visible to users
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
                    When enabled, program is visible to users
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

// Delete Program Modal
function DeleteProgramModal({ id }: { id: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/programs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Program deleted successfully!");
        window.location.reload();
      } else {
        const error = await res.json();
        alert(`Delete failed: ${error.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed - check console for details");
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setIsOpen(true)}
      >
        <Trash className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              program.
            </DialogDescription>
          </DialogHeader>
          <p>Are you sure you want to delete Program #{id}?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Table Columns
export const programColumns: ColumnDef<ProgramItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono">#{row.original.id}</span>,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.original.title}>
        {row.original.title}
      </div>
    ),
  },
  {
    id: "image",
    header: "Image",
    cell: ({ row }) => (
      <ImageThumb src={row.original.image} alt={row.original.name} />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const program = row.original;
      return (
        <div className="flex flex-col gap-1">
          <Badge
            variant={program.is_draft ? "default" : "outline"}
            className={`text-xs ${
              program.is_draft ? "bg-yellow-500 hover:bg-yellow-600" : ""
            }`}
          >
            {program.is_draft ? "Draft" : "Not Draft"}
          </Badge>
          <Badge
            variant={program.is_published ? "default" : "outline"}
            className={`text-xs ${
              program.is_published ? "bg-green-500 hover:bg-green-600" : ""
            }`}
          >
            {program.is_published ? "Published" : "Not Published"}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-1">
        <ViewProgramModal program={row.original} />
        <EditProgramModal program={row.original} />
        <DeleteProgramModal id={row.original.id} />
      </div>
    ),
  },
];
