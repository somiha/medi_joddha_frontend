"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { UserActions } from "./userActions";
import type { CellContext } from "@tanstack/react-table";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "admin" | "agent";
  isApproved: boolean;
  canReceiveRemittanceList?: boolean;
  isHidden?: boolean;
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
};

interface TableMeta {
  updateUser?: (userId: string, updates: Partial<User>) => void;
  deleteUser?: (userId: string) => void;
  refetchData?: () => void;
}

// ✅ Admin column — unchanged
const adminColumn = {
  id: "admin",
  header: "Admin",
  cell: ({ row }: CellContext<User, unknown>) => (
    <div>
      {row.original.type === "agent" && row.original.admin ? (
        <div className="flex items-center gap-2">
          <span>{row.original.admin.name}</span>
        </div>
      ) : (
        <span className="text-gray-400">N/A</span>
      )}
    </div>
  ),
} satisfies ColumnDef<User>;

// ✅ Base columns — without admin column
const baseColumns: ColumnDef<User>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Full Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "isApproved",
    header: "isApproved",
    cell: ({ row }) => (
      <Badge
        className={`px-2 py-1 rounded-md ${
          row.original.isApproved
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {row.original.isApproved ? "Approved" : "Pending"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status?.toLowerCase();
      return (
        <Badge
          className={
            status === "active"
              ? "bg-green-500 hover:bg-green-600 text-white"
              : status === "hold"
              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
              : status === "blocked"
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-gray-500 hover:bg-gray-600 text-white"
          }
        >
          {status
            ? status.charAt(0).toUpperCase() + status.slice(1)
            : "Unknown"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "canReceiveRemittanceList",
    header: "Can Receive Remittance",
    cell: ({ row }) =>
      row.original.type === "agent" ? (
        <Badge
          className={`px-2 py-1 rounded-md ${
            row.original.canReceiveRemittanceList
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.original.canReceiveRemittanceList ? "Yes" : "No"}
        </Badge>
      ) : null,
  },
  {
    accessorKey: "isHidden",
    header: "Is Hidden",
    cell: ({ row }) =>
      row.original.type === "agent" ? (
        <Badge
          className={`px-2 py-1 rounded-md ${
            row.original.isHidden
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.original.isHidden ? "Yes" : "No"}
        </Badge>
      ) : null,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as TableMeta | undefined;

      return (
        <UserActions
          user={row.original}
          onUserUpdate={(updates) =>
            meta?.updateUser?.(row.original.id, updates)
          }
          onUserDelete={(userId) => meta?.deleteUser?.(userId)}
          onActionComplete={() => meta?.refetchData?.()}
        />
      );
    },
  },
];

// ✅ Export function to get columns based on userType
export const getColumns = (userType: "admin" | "agent"): ColumnDef<User>[] => {
  if (userType === "agent") {
    // Insert admin column after "phone" (which is at index 4)
    return [...baseColumns.slice(0, 5), adminColumn, ...baseColumns.slice(5)];
  }
  return baseColumns; // No admin column for admins
};
