"use client";

import { useEffect, useState } from "react";
import { boardColumns, BoardItem } from "./columns";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BASE_URL = "https://medijoddha.save71.net";

export default function BoardsPage() {
  const [boards, setBoards] = useState<BoardItem[]>([]);
  const [filteredBoards, setFilteredBoards] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchBoards = async () => {
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

      const res = await fetch(`${BASE_URL}/api/boards`, { headers });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch boards: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();

      // If the API returns an array directly
      if (Array.isArray(data)) {
        setBoards(data);
        setFilteredBoards(data);
      }
      // If the API returns an object with a boards property
      else if (data.boards && Array.isArray(data.boards)) {
        setBoards(data.boards);
        setFilteredBoards(data.boards);
      }
      // Fallback
      else {
        console.warn("Unexpected API response format:", data);
        setBoards([]);
        setFilteredBoards([]);
      }
    } catch (err) {
      console.error("Error fetching boards:", err);
      setError(err instanceof Error ? err.message : "Failed to load boards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  // Filter boards based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBoards(boards);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = boards.filter(
      (board) =>
        board.name.toLowerCase().includes(query) ||
        board.id.toString().includes(query)
    );

    setFilteredBoards(filtered);
    setCurrentPage(1);
  }, [searchQuery, boards]);

  // Calculate pagination
  const totalItems = filteredBoards.length;

  // Get current page items
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageData = filteredBoards.slice(startIndex, endIndex);

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
        <h1 className="text-2xl font-bold">Boards</h1>
        <Link href="/boards/add-board">
          <Button className="text-white hover:opacity-90">+ Add Board</Button>
        </Link>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search boards by name or ID..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {currentPageData.length} of {totalItems} boards
          {searchQuery && <span> (filtered from {boards.length} total)</span>}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2">Loading boards...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <Button onClick={() => fetchBoards()} variant="outline">
            Retry
          </Button>
        </div>
      ) : boards.length === 0 ? (
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
          <p className="text-gray-500 mb-4">No boards found.</p>
          <Link href="/boards/add-board">
            <Button>Create Your First Board</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={boardColumns}
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
