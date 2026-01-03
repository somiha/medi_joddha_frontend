"use client";

import { useEffect, useState } from "react";
import { schoolCollegeColumns, SchoolCollegeItem } from "./columns";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BASE_URL = "https://medijoddha.save71.net";

export default function SchoolCollegesPage() {
  const [schoolColleges, setSchoolColleges] = useState<SchoolCollegeItem[]>([]);
  const [filteredSchoolColleges, setFilteredSchoolColleges] = useState<
    SchoolCollegeItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchSchoolColleges = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Remove pagination params from URL since API doesn't support it
      const url = `${BASE_URL}/api/school-colleges`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch school colleges: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();

      // Handle different API response formats
      if (Array.isArray(data)) {
        setSchoolColleges(data);
        setFilteredSchoolColleges(data);
      } else if (data.schoolColleges && Array.isArray(data.schoolColleges)) {
        setSchoolColleges(data.schoolColleges);
        setFilteredSchoolColleges(data.schoolColleges);
      } else if (data.data && Array.isArray(data.data)) {
        setSchoolColleges(data.data);
        setFilteredSchoolColleges(data.data);
      } else {
        console.warn("Unexpected API response format:", data);
        setSchoolColleges([]);
        setFilteredSchoolColleges([]);
      }
    } catch (err) {
      console.error("Error fetching school colleges:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load school colleges"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolColleges();
  }, []);

  // Filter school colleges based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSchoolColleges(schoolColleges);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = schoolColleges.filter(
      (item) =>
        item.name?.toLowerCase().includes(query) ||
        item.id?.toString().includes(query)
    );

    setFilteredSchoolColleges(filtered);
    setCurrentPage(1);
  }, [searchQuery, schoolColleges]);

  // Calculate pagination
  const totalItems = filteredSchoolColleges.length;

  // Get current page items
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageData = filteredSchoolColleges.slice(startIndex, endIndex);

  const handlePageChange = (newPageIndex: number) => {
    setCurrentPage(newPageIndex + 1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">School Colleges</h1>
        <Link href="/school-colleges/add-school-college">
          <Button className="text-white hover:opacity-90">
            + Add School College
          </Button>
        </Link>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, title, or description..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {currentPageData.length} of {totalItems} school colleges
          {searchQuery && (
            <span> (filtered from {schoolColleges.length} total)</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2">Loading school colleges...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <Button onClick={() => fetchSchoolColleges()} variant="outline">
            Retry
          </Button>
        </div>
      ) : schoolColleges.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">No school colleges found.</p>
          <Link href="/school-colleges/add-school-college">
            <Button>Create Your First School College</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={schoolCollegeColumns}
          data={currentPageData}
          totalItems={totalItems}
          pageIndex={currentPage - 1}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
