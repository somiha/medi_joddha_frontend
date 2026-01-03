"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

const BASE_URL = "https://medijoddha.save71.net";

export default function AddBoardPage() {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const validateForm = () => {
    if (!name.trim()) {
      setError("Board name is required");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${BASE_URL}/api/boards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const result = await res.json();

      if (res.ok && result.board) {
        alert("Board added successfully!");
        router.push("/boards");
      } else {
        alert(result.message || "Failed to add board");
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
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add New Board</h1>
        <Button variant="outline" onClick={() => router.push("/boards")}>
          ← Back to Boards
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Board Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dhaka"
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
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
                "Save Board"
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
