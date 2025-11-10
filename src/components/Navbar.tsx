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
import { ChevronDown } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  // Remove authentication logic
  const name = "Admin User";
  const adminType = "Administrator";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="p-4 flex items-center justify-between">
        {/* Combined SidebarTrigger and Search (both mobile and desktop) */}
        <div className="flex items-center gap-2">
          <SidebarTrigger />
        </div>

        {/* USER MENU (right side) */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/admin.png" alt="Admin" />
                    <AvatarFallback>A</AvatarFallback>
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
              <DropdownMenuItem className="text-red-500 focus:text-red-500">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}
