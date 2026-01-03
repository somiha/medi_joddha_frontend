"use client";

import { useEffect, useState } from "react";
import { universityColumns, UniversityItem } from "./columns";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BASE_URL = "https://medijoddha.save71.net";

export default function UniversitiesPage() {
  const [allUniversities, setAllUniversities] = useState<UniversityItem[]>([]);
  const [displayedUniversities, setDisplayedUniversities] = useState<
    UniversityItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchUniversities = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      // Remove pagination params from URL
      const url = `${BASE_URL}/api/universities`;
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const res = await fetch(url, { headers });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch universities: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();

      // Handle different API response formats
      let universitiesArray: UniversityItem[] = [];

      if (Array.isArray(data)) {
        universitiesArray = data;
      } else if (data.universities && Array.isArray(data.universities)) {
        universitiesArray = data.universities;
      } else if (data.data && Array.isArray(data.data)) {
        universitiesArray = data.data;
      } else {
        console.warn("Unexpected API response format:", data);
      }

      setAllUniversities(universitiesArray);
      setDisplayedUniversities(universitiesArray.slice(0, pageSize)); // Initial pagination
    } catch (err) {
      console.error("Error fetching universities:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load universities"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  // Apply search filter and pagination
  useEffect(() => {
    let filtered = allUniversities;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = allUniversities.filter(
        (item) =>
          item.name?.toLowerCase().includes(query) ||
          item.id?.toString().includes(query)
      );
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filtered.slice(startIndex, endIndex);

    setDisplayedUniversities(paginatedData);
  }, [allUniversities, searchQuery, currentPage, pageSize]);

  const totalItems = searchQuery.trim()
    ? allUniversities.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.id?.toString().includes(searchQuery.toLowerCase())
      ).length
    : allUniversities.length;

  const handlePageChange = (newPageIndex: number) => {
    setCurrentPage(newPageIndex + 1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Universities</h1>
        <Link href="/universities/add-university">
          <Button className="text-white hover:opacity-90">
            + Add University
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
      {!loading && !error && allUniversities.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {displayedUniversities.length} of {totalItems} universities
          {searchQuery && (
            <span> (filtered from {allUniversities.length} total)</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2">Loading universities...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <Button onClick={() => fetchUniversities()} variant="outline">
            Retry
          </Button>
        </div>
      ) : allUniversities.length === 0 ? (
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
          <p className="text-gray-500 mb-4">No universities found.</p>
          <Link href="/universities/add-university">
            <Button>Create Your First University</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={universityColumns}
          data={displayedUniversities}
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
