// app/programs/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { programColumns, ProgramItem } from "./columns";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BASE_URL = "https://medijoddha.save71.net";

interface ApiResponse {
  programs: ProgramItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      if (!token) {
        console.error("No token found");
        return;
      }
      const url = `${BASE_URL}/api/programs?page=${currentPage}&limit=${pageSize}`;
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch(url, { headers });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch programs: ${res.status} ${res.statusText}`
        );
      }

      const data: ApiResponse = await res.json();

      setPrograms(data.programs || []);
      setTotalItems(data.pagination.totalItems || 0);
    } catch (err) {
      console.error("Error fetching programs:", err);
      setError(err instanceof Error ? err.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Programs</h1>
        <Link href="/programs/add-program">
          <Button className="text-white hover:opacity-90">+ Add Program</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-center py-4">Loading programs...</p>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <Button onClick={() => fetchPrograms()} variant="outline">
            Retry
          </Button>
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No programs found.</p>
          <Link href="/programs/add-program">
            <Button className="mt-2">Create Your First Program</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={programColumns}
          data={programs}
          totalItems={totalItems}
          pageIndex={currentPage - 1}
          pageSize={pageSize}
          onPageChange={(newIndex) => setCurrentPage(newIndex + 1)}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
