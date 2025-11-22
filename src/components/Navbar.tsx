"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SidebarTrigger } from "./ui/sidebar";

import { Button } from "./ui/button";
// import { Input } from "./ui/input";
// import { Search } from "lucide-react";
// import { Bell } from "lucide-react";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();
  const [adminType, setAdminType] = useState("");
  const [name, setName] = useState("");
  function handleLogout() {
    // remove all localhost data and redirect to login
    localStorage.clear();
    router.push("/signin");
  }

  useEffect(() => {
    const admin = localStorage.getItem("adminType");
    if (admin) {
      if (admin === "super_admin") {
        setAdminType("Super Admin");
      } else {
        setAdminType("Admin");
      }
    }

    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setName(parsedUser.full_name);
    }
  }, []);
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="p-4 flex items-center justify-between">
        {/* Combined SidebarTrigger and Search (both mobile and desktop) */}
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          {/* <div className="flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-10 pr-4 py-2 w-40 h-10 md:w-64 bg-[#FFF0F1] focus-visible:ring-0 focus-visible:ring-offset-0 border-0 rounded-r-none"
                placeholder="Search..."
              />
            </div>
            <Button
              className="rounded-l-none bg-gradient-to-r from-[rgb(var(--gradient-from))] via-[rgb(var(--gradient-via))] to-[rgb(var(--gradient-to))] text-white hover:opacity-90 transition-opacity h-10 px-3 md:px-4"
              type="submit"
            >
              <span className="sr-only md:not-sr-only">Search</span>
              <Search className="h-4 w-4 md:hidden" />
            </Button>
          </div> */}
        </div>

        {/* USER MENU (right side) */}
        <div className="flex items-center gap-4">
          {/* <Button
            variant="ghost"
            size="icon"
            className="relative p-0 hidden sm:flex"
          >
            <div className="bg-gradient-to-r from-[rgb(var(--gradient-from))] via-[rgb(var(--gradient-via))] to-[rgb(var(--gradient-to))] p-1 rounded-full">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-gradient-to-r from-[rgb(var(--gradient-from))] via-[rgb(var(--gradient-via))] to-[rgb(var(--gradient-to))]"></span>
          </Button> */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/admin.png" alt="Admin" />
                    <AvatarFallback> {name?.charAt(0) || "A"}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium bg-gradient-to-r from-[#3F1729] via-[#71113D] to-[#D4136B] text-transparent bg-clip-text">
                      {name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {adminType}
                    </span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-red-500 focus:text-red-500"
                onClick={handleLogout}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}
