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

import { Trash } from "lucide-react";

const BASE_URL = "https://medijoddha.save71.net";

export interface UniversityItem {
  id: number;
  name: string;
}

// Delete University Modal
function DeleteUniversityModal({ id, name }: { id: number; name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${BASE_URL}/api/universities/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("University deleted successfully!");
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
              university `{name}``.
            </DialogDescription>
          </DialogHeader>
          <p>Are you sure you want to delete University #{id}?</p>
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
export const universityColumns: ColumnDef<UniversityItem>[] = [
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
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <DeleteUniversityModal id={row.original.id} name={row.original.name} />
      </div>
    ),
  },
];
