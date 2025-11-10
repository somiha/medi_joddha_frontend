"use client";

import React, { useEffect, useState } from "react";
import { SidebarProvider } from "./sidebar";
import Cookies from "js-cookie";

const SidebarProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState(true); // default value

  useEffect(() => {
    const cookie = Cookies.get("sidebar_state");
    if (cookie !== undefined) {
      setDefaultOpen(cookie === "true");
    }
    setMounted(true); // ensure this comes *after* setting the value
  }, []);

  if (!mounted) return null;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {children}
    </SidebarProvider>
  );
};

export default SidebarProviderWrapper;
