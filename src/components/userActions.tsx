"use client";

import { useState, MouseEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Eye,
  Trash,
  MoreVertical,
  ToggleLeft,
  ToggleRight,
  Check,
  UserCog,
  Power,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "lucide-react";

interface Admin {
  id: string;
  full_name: string;
  email: string;
  phone_no?: string;
  isApproved?: boolean;
  type?: "admin" | "agent";
  canReceiveRemittanceList?: boolean;
  image?: string | null;
  isHidden?: boolean;
}

interface ApiAdminResponse {
  id: string;
  full_name: string;
  email: string;
  phone_no?: string;
  isApproved?: boolean;
  type?: "admin" | "agent";
  canReceiveRemittanceList?: boolean;
  image?: string | null;
  isHidden?: boolean;
}

interface User {
  id: string;
  type: "admin" | "agent";
  isApproved: boolean;
  status: "active" | "hold" | "blocked";
  canReceiveRemittanceList?: boolean;
  isHidden?: boolean;
  name: string;
  email: string;
  phone: string;
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
}

interface UserActionsProps {
  user: User;
  onActionComplete?: () => void;
  onUserUpdate?: (updates: Partial<User>) => void;
  onUserDelete?: (userId: string) => void;
  onStatusChange?: (newStatus: "active" | "hold" | "blocked") => void;
}

export function UserActions({
  user,
  onActionComplete,
  onUserUpdate,
  onUserDelete,
  onStatusChange,
}: UserActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false); // ✅ Manual state for Assign Admin
  const [actionType, setActionType] = useState<
    "approve" | "delete" | "toggle" | "assign" | "status" | "hidden"
  >();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState<"active" | "hold" | "blocked">(
    user.status
  );

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authentication token not found");

      const res = await fetch("https://api.t-coin.code-studio4.com/admins", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data;

      if (!Array.isArray(data)) throw new Error("Invalid data");

      const formatted: Admin[] = data
        .map((admin: ApiAdminResponse): Admin | null => {
          try {
            return {
              id: admin.id.toString(),
              full_name: admin.full_name || "Unnamed Admin",
              email: admin.email || "no-email@example.com",
            };
          } catch {
            return null;
          }
        })
        .filter((a): a is Admin => !!a);

      setAdmins(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch admins");
      setAdmins([]);
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleAction = async (
    type: "approve" | "delete" | "toggle" | "assign" | "status" | "hidden"
  ) => {
    setActionType(type);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      const userStr = localStorage.getItem("user");
      const currentUser = userStr ? JSON.parse(userStr) : null;

      if (!token || !currentUser?.id) {
        throw new Error("Authorization error. Please log in again.");
      }

      let endpoint = "";
      let method = "GET";
      let body = null;

      switch (type) {
        case "approve":
          endpoint = `https://api.t-coin.code-studio4.com/api/super-admin/${currentUser.id}/approve`;
          method = "POST";
          body = JSON.stringify({
            approveUserId: user.id,
            type: user.type,
            approveStatus: true,
          });
          break;
        case "delete":
          endpoint =
            user.type === "admin"
              ? `https://api.t-coin.code-studio4.com/api/admins/${user.id}`
              : `https://api.t-coin.code-studio4.com/api/agents/${user.id}`;
          method = "DELETE";
          break;
        case "toggle":
          endpoint = `https://api.t-coin.code-studio4.com/api/agents/${user.id}`;
          method = "PUT";
          body = JSON.stringify({
            canReceiveRemittanceList: !user.canReceiveRemittanceList,
          });
          break;
        case "hidden":
          endpoint = `https://api.t-coin.code-studio4.com/api/agents/${user.id}`;
          method = "PUT";
          body = JSON.stringify({
            isHidden: !user.isHidden,
          });
          break;
        case "assign":
          if (!selectedAdminId) throw new Error("Please select an admin");
          endpoint = `https://api.t-coin.code-studio4.com/api/agents/${user.id}`;
          method = "PUT";
          body = JSON.stringify({
            newAdminId: selectedAdminId,
          });
          break;
        case "status":
          if (user.type === "admin") {
            endpoint = `https://api.t-coin.code-studio4.com/api/users/bulk-update/multiple`;
            method = "PUT";
            body = JSON.stringify({
              userIds: [user.id],
              userType: "admin",
              updateData: {
                status: newStatus,
              },
              note: statusNote || `Admin status updated to ${newStatus}`,
            });
          } else {
            endpoint = `https://api.t-coin.code-studio4.com/api/agents/${user.id}/status`;
            method = "PUT";
            body = JSON.stringify({
              status: newStatus,
              note: statusNote || `Agent status updated to ${newStatus}`,
            });
          }
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Action failed");
      }

      toast.success(
        type === "approve"
          ? `${user.type.toUpperCase()} approved successfully`
          : type === "delete"
          ? `${user.type.toUpperCase()} deleted successfully`
          : type === "toggle"
          ? `Remittance ${
              !user.canReceiveRemittanceList ? "enabled" : "disabled"
            } successfully`
          : type === "hidden"
          ? `Hidden ${user.isHidden ? "enabled" : "disabled"} successfully`
          : type === "assign"
          ? "Admin assigned successfully"
          : `Status updated to ${newStatus}`
      );

      // Call appropriate callbacks
      switch (type) {
        case "approve":
          onUserUpdate?.({ isApproved: true });
          break;
        case "delete":
          onUserDelete?.(user.id);
          break;
        case "toggle":
          onUserUpdate?.({
            canReceiveRemittanceList: !user.canReceiveRemittanceList,
          });
          break;
        case "hidden":
          onUserUpdate?.({ isHidden: !user.isHidden });
          break;
        case "status":
          onStatusChange?.(newStatus);
          break;
      }

      onActionComplete?.();
    } catch (error) {
      console.error("Action error:", error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
      setShowStatusDialog(false);
      setShowDeleteConfirm(false);
      if (type === "assign") {
        setAssignDialogOpen(false); // ✅ Close assign dialog on success/error
        setSelectedAdminId(""); // Reset selection
      }
    }
  };

  const handleStatusNoteChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setStatusNote(e.target.value);
  };

  const handleAdminSelect = (value: string) => {
    setSelectedAdminId(value);
  };

  const handleDropdownItemClick = (e: MouseEvent, action: string) => {
    e.preventDefault();
    switch (action) {
      case "approve":
        handleAction("approve");
        break;
      case "toggle":
        handleAction("toggle");
        break;
      case "hidden":
        handleAction("hidden");
        break;
      case "status":
        setShowStatusDialog(true);
        break;
      case "assign":
      default:
        break;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* View Details Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gradient-to-r from-[rgb(var(--gradient-from))] via-[rgb(var(--gradient-via))] to-[rgb(var(--gradient-to))] text-white hover:opacity-90"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - User Info */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {user.image && (
                  <div className="relative h-24 w-24 min-w-[6rem]">
                    <Image
                      src={user.image}
                      alt="User image"
                      fill
                      className="rounded-md object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <InfoRow label="Type" value={user.type} />
                  <InfoRow
                    label="Approval Status"
                    value={user.isApproved ? "Approved" : "Pending"}
                  />
                  <InfoRow
                    label="Account Status"
                    value={
                      user.status === "active"
                        ? "Active"
                        : user.status === "blocked"
                        ? "Blocked"
                        : "Hold"
                    }
                  />
                  <InfoRow label="Country" value={user.country} />
                  <InfoRow label="City" value={user.city} />
                  <InfoRow label="Address" value={user.address} />
                  <InfoRow label="NID Number" value={user.nid_card_number} />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Balances</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <InfoRow
                    label="T-Coin Balance"
                    value={user.tcoin_balance || "0.00"}
                  />
                  <InfoRow
                    label="Local Currency"
                    value={user.local_currency_balance || "0.00"}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Documents */}
            <div className="space-y-4">
              {user.qr_code && (
                <ImageBlock title="QR Code" src={user.qr_code} />
              )}
              {user.nid_card_front_pic_url && (
                <ImageBlock
                  title="NID Front"
                  src={user.nid_card_front_pic_url}
                />
              )}
              {user.nid_card_back_pic_url && (
                <ImageBlock title="NID Back" src={user.nid_card_back_pic_url} />
              )}
              {user.passport_file_url && (
                <ImageBlock title="Passport" src={user.passport_file_url} />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            title="More actions"
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Status Update Option */}
          <DropdownMenuItem
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              setNewStatus(user.status as "active" | "hold" | "blocked");
              setShowStatusDialog(true);
            }}
            disabled={isLoading && actionType === "status"}
          >
            {isLoading && actionType === "status" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Power className="mr-2 h-4 w-4" />
            )}
            Update Status
          </DropdownMenuItem>

          {/* Delete Action */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e: Event) => e.preventDefault()}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
              </DialogHeader>
              <p>
                Are you sure you want to delete <strong>{user.name}</strong>?
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAction("delete")}
                  disabled={isLoading && actionType === "delete"}
                >
                  {isLoading && actionType === "delete" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Approve Action */}
          {!user.isApproved && (
            <DropdownMenuItem
              onClick={(e: MouseEvent) => handleDropdownItemClick(e, "approve")}
              disabled={isLoading && actionType === "approve"}
            >
              {isLoading && actionType === "approve" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Approve User
            </DropdownMenuItem>
          )}

          {/* Agent-specific Actions */}
          {user.type === "agent" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e: MouseEvent) =>
                  handleDropdownItemClick(e, "toggle")
                }
                disabled={isLoading && actionType === "toggle"}
              >
                {isLoading && actionType === "toggle" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : user.canReceiveRemittanceList ? (
                  <ToggleLeft className="mr-2 h-4 w-4" />
                ) : (
                  <ToggleRight className="mr-2 h-4 w-4" />
                )}
                {user.canReceiveRemittanceList
                  ? "Disable Remittance"
                  : "Enable Remittance"}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e: MouseEvent) =>
                  handleDropdownItemClick(e, "hidden")
                }
                disabled={isLoading && actionType === "hidden"}
              >
                {isLoading && actionType === "hidden" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : user.isHidden ? (
                  <ToggleLeft className="mr-2 h-4 w-4" />
                ) : (
                  <ToggleRight className="mr-2 h-4 w-4" />
                )}
                {user.isHidden ? "Disable Hidden" : "Enable Hidden"}
              </DropdownMenuItem>

              {/* ✅ STABLE: Assign Admin Dialog — Manual State Control */}
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAssignDialogOpen(true); // ✅ Direct, stable open
                  fetchAdmins(); // Fetch when opening
                }}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Assign Admin
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Assign Admin Dialog — Controlled */}
      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAdminId(""); // Reset on close
          }
          setAssignDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Admin to Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Assigning admin to: <strong>{user.name}</strong>
              </p>
              <Select value={selectedAdminId} onValueChange={handleAdminSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an admin" />
                </SelectTrigger>
                <SelectContent>
                  {adminsLoading ? (
                    <div className="p-2 text-sm">Loading admins...</div>
                  ) : admins.length > 0 ? (
                    admins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.full_name} ({admin.email})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No admins available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => handleAction("assign")}
              disabled={isLoading || !selectedAdminId || admins.length === 0}
              className="w-full"
            >
              {isLoading && actionType === "assign" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Assign Admin"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>
                {newStatus === "active" && (
                  <Badge className="bg-green-500 text-white">Active</Badge>
                )}
                {newStatus === "hold" && (
                  <Badge className="bg-yellow-500 text-white">Hold</Badge>
                )}
                {newStatus === "blocked" && (
                  <Badge className="bg-red-500 text-white">Blocked</Badge>
                )}
              </span>
              <span className="text-sm text-muted-foreground">
                Update {user.name} status
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Select
              value={newStatus}
              onValueChange={(val: "active" | "hold" | "blocked") =>
                setNewStatus(val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Add a note (optional)"
              value={statusNote}
              onChange={handleStatusNoteChange}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleAction("status")}
              disabled={isLoading && actionType === "status"}
            >
              {isLoading && actionType === "status" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Confirm Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper components
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p>{value || "-"}</p>
    </div>
  );
}

function ImageBlock({ title, src }: { title: string; src: string }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">{title}</h4>
      <div className="relative w-full h-40">
        <Image
          src={src}
          alt={title}
          fill
          className="rounded-md object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}
