"use client";

import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import SidebarProviderWrapper from "@/components/ui/sidebar-provider-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
