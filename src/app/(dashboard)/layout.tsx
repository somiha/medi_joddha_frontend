"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import SidebarProviderWrapper from "@/components/ui/sidebar-provider-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");

      // If no token and we're on a dashboard route, redirect to signin
      if (!token) {
        router.push("/signin");
        // return;
      }

      // Optional: Verify token validity with API
      // if (token) {
      //   verifyToken(token).catch(() => {
      //     localStorage.removeItem('authToken');
      //     router.push('/auth/signin');
      //   });
      // }
    };

    // Check auth on initial load
    checkAuth();

    // Set up storage event listener to handle auth changes in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authToken") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router, pathname]);

  return (
    <SidebarProviderWrapper>
      <AppSidebar />
      <main className="w-full overflow-x-hidden">
        <Navbar />
        <div className="px-4 overflow-x-auto">{children}</div>
      </main>
    </SidebarProviderWrapper>
  );
}
