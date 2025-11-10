"use client";

import { DataTable } from "./../app/(dashboard)/data-table"; // Adjust path as needed
import { getColumns } from "@/components/columns";
import { User } from "@/components/columns";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ApiUser {
  id: number;
  full_name: string;
  email: string;
  phone_no: string;
  isApproved: boolean;
  type: "admin" | "agent";
  canReceiveRemittanceList?: boolean;
  image?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  zip_code?: string | null;
  nid_card_number?: string | null;
  nid_card_front_pic_url?: string | null;
  nid_card_back_pic_url?: string | null;
  passport_file_url?: string | null;
  qr_code?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tcoin_balance?: string;
  local_currency_balance?: string;
  accepted_terms?: boolean;
  birth_date?: string | null;
  institution_name?: string | null;
  status: "active" | "hold" | "blocked";
  isHidden?: boolean;
  admin?: {
    id: number;
    name: string;
    type: string;
    email: string;
    image: string;
    phone_no: string;
    country: string;
    approve_status: boolean;
  } | null;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data: {
    admins?: ApiUser[];
    agents?: ApiUser[];
  };
}

interface UserTableProps {
  userType: "admin" | "agent";
  title: string;
  addButtonHref?: string;
  showAddButton?: boolean;
}

export function UserTable({
  userType,
  title,
  addButtonHref,
  showAddButton = true,
}: UserTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminFilter, setAdminFilter] = useState<string>("all"); // ✅ For dropdown
  const [uniqueAdmins, setUniqueAdmins] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "All Admins" }]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("authToken");
      const adminType = localStorage.getItem("adminType");

      if (!userStr || !token || !adminType) {
        throw new Error("Authorization error");
      }

      const user = JSON.parse(userStr);

      // ✅ CRITICAL FIX: Remove extra spaces in URL
      const response = await fetch(
        `https://api.t-coin.code-studio4.com/api/super-admin/user-list/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // ✅ Better error: show what server actually returned
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch users");
      }

      let allUsers: User[] = [];

      if (userType === "admin" && data.data.admins) {
        allUsers = data.data.admins.map((u: ApiUser) => ({
          id: u.id.toString(),
          name: u.full_name,
          email: u.email,
          phone: u.phone_no,
          type: "admin",
          isApproved: u.isApproved,
          canReceiveRemittanceList: u.canReceiveRemittanceList || false,
          image: u.image,
          address: u.address,
          city: u.city,
          country: u.country,
          state: u.state,
          zip_code: u.zip_code,
          nid_card_number: u.nid_card_number,
          nid_card_front_pic_url: u.nid_card_front_pic_url,
          nid_card_back_pic_url: u.nid_card_back_pic_url,
          passport_file_url: u.passport_file_url,
          qr_code: u.qr_code,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          tcoin_balance: u.tcoin_balance,
          local_currency_balance: u.local_currency_balance,
          accepted_terms: u.accepted_terms,
          birth_date: u.birth_date,
          institution_name: u.institution_name,
          status: u.status,
          admin: u.admin
            ? {
                id: u.admin.id || 0,
                name: u.admin.name || "",
                type: u.admin.type || "",
                email: u.admin.email || "",
                image: u.admin.image || "",
                phone_no: u.admin.phone_no || "",
                country: u.admin.country || "",
                approve_status: u.admin.approve_status || false,
              }
            : null,
        }));
      } else if (userType === "agent" && data.data.agents) {
        allUsers = data.data.agents.map((u: ApiUser) => ({
          id: u.id.toString(),
          name: u.full_name,
          email: u.email,
          phone: u.phone_no,
          type: "agent",
          isApproved: u.isApproved,
          canReceiveRemittanceList: u.canReceiveRemittanceList || false,
          image: u.image,
          address: u.address,
          city: u.city,
          country: u.country,
          state: u.state,
          zip_code: u.zip_code,
          nid_card_number: u.nid_card_number,
          nid_card_front_pic_url: u.nid_card_front_pic_url,
          nid_card_back_pic_url: u.nid_card_back_pic_url,
          passport_file_url: u.passport_file_url,
          qr_code: u.qr_code,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          tcoin_balance: u.tcoin_balance,
          local_currency_balance: u.local_currency_balance,
          accepted_terms: u.accepted_terms,
          birth_date: u.birth_date,
          institution_name: u.institution_name,
          status: u.status,
          isHidden: u.isHidden,
          admin: u.admin
            ? {
                id: u.admin.id || 0,
                name: u.admin.name || "",
                type: u.admin.type || "",
                email: u.admin.email || "",
                image: u.admin.image || "",
                phone_no: u.admin.phone_no || "",
                country: u.admin.country || "",
                approve_status: u.admin.approve_status || false,
              }
            : null,
        }));
      }
      const adminSet = new Set<string>();
      allUsers.forEach((user) => {
        if (user.admin?.name) {
          adminSet.add(user.admin.name);
        }
      });

      const adminOptions = [
        { value: "all", label: "All Admins" },
        ...Array.from(adminSet)
          .sort((a, b) => a.localeCompare(b)) // Optional: sort A-Z
          .map((name) => ({
            value: name,
            label: name,
          })),
      ];

      setUniqueAdmins(adminOptions);

      setUsers(allUsers);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, ...updates } : user
      )
    );
  };

  const deleteUser = (userId: string) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  // ✅ useEffect: Only re-fetch when userType changes
  useEffect(() => {
    fetchUsers();
  }, [userType]);

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.country?.toLowerCase().includes(query) ||
      user.state?.toLowerCase().includes(query) ||
      user.city?.toLowerCase().includes(query) ||
      user.zip_code?.toLowerCase().includes(query) ||
      user.birth_date?.toLowerCase().includes(query) ||
      user.address?.toLowerCase().includes(query) ||
      user.institution_name?.toLowerCase().includes(query) ||
      user.qr_code?.toLowerCase().includes(query) ||
      user.nid_card_number?.toLowerCase().includes(query);

    // Admin filter
    const matchesAdminFilter =
      adminFilter === "all" || user.admin?.name === adminFilter;

    return matchesSearch && matchesAdminFilter;
  });

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="grid auto-rows-max items-start gap-2 md:gap-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {showAddButton && addButtonHref && (
                <Link href={addButtonHref}>
                  <Button className="bg-gradient-to-r from-[rgb(var(--gradient-from))] via-[rgb(var(--gradient-via))] to-[rgb(var(--gradient-to))] text-white hover:opacity-90">
                    + Add {userType === "admin" ? "Admin" : "Agent"}
                  </Button>
                </Link>
              )}
            </div>

            {/* 🔍 Global Search */}
            <div className="mb-4">
              <div className="mb-4 relative">
                <Input
                  placeholder={`Search ${userType}s by name, phone, email, etc.`}
                  className="max-w-sm pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute p-1 h-6 w-6 text-gray-400 left-2 top-2" />
              </div>
            </div>

            {/* 👥 Admin Filter Dropdown — ONLY for AGENTS */}
            {userType === "agent" && (
              <div className="mb-4">
                <Label
                  htmlFor="admin-filter"
                  className="block text-sm font-medium mb-2"
                >
                  Filter by Admin
                </Label>
                <Select value={adminFilter} onValueChange={setAdminFilter}>
                  <SelectTrigger id="admin-filter" className="w-[180px]">
                    <SelectValue placeholder="Select admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueAdmins.map((admin) => (
                      <SelectItem key={admin.value} value={admin.value}>
                        {admin.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* <div className="mb-4">
              <div className="mb-4 relative">
                <Input
                  placeholder={`Search ${userType}s by name, phone, email, etc.`}
                  className="max-w-sm pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute p-1 h-6 w-6 text-gray-400 left-2 top-2" />
              </div>
            </div> */}

            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <p>Loading {userType}s...</p>
                  </div>
                ) : error ? (
                  <div className="text-red-500 p-4">{error}</div>
                ) : (
                  <DataTable
                    columns={getColumns(userType)}
                    data={filteredUsers}
                    meta={{
                      updateUser,
                      deleteUser,
                      refetchData: fetchUsers,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
