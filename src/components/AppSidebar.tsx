"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  //Users,
  // CreditCard,
  // TrendingUp,
  // Trophy,
  //Film,
  ChevronDown,
  // UserCheck,
  // Coins,
  FileText,
  // Settings,
  // Globe,
  // Tag,
  // Database,
  // Newspaper,
  //Shield,
  // Banknote,
  // ChartNoAxesCombined,
  // BookOpen,
  // Building,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Image from "next/image";

import { usePathname } from "next/navigation";

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  subItems?: {
    name: string;
    href: string;
  }[];
}

const adminItems: MenuItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Questions", icon: FileText, href: "/questions" },
];

const baseMenuItems: MenuItem[] = [];

const AppSidebar = () => {
  const pathname = usePathname();

  const menuItems = [...baseMenuItems, ...adminItems];

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href;
  };

  const isSubItemActive = (subItems?: { name: string; href: string }[]) => {
    if (!subItems) return false;
    return subItems.some((sub) => pathname === sub.href);
  };

  return (
    <Sidebar className="bg-sidebar text-sidebar-primary">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/logo5.png"
            alt="Logo"
            width={160}
            height={160}
            priority
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) =>
                item.subItems ? (
                  <Collapsible
                    key={item.name}
                    className="mb-1"
                    defaultOpen={isSubItemActive(item.subItems)}
                  >
                    <SidebarMenuItem>
                      <div
                        className={`flex items-center text-lg justify-between w-full p-2 rounded transition-colors ${
                          isSubItemActive(item.subItems)
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "hover:bg-sidebar-primary hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <CollapsibleTrigger className="flex-1 text-left hover:bg-transparent flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </div>
                          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <SidebarMenuSub className="ml-4 mt-1 space-y-1">
                          {item.subItems.map((sub) => (
                            <SidebarMenuSubItem key={sub.name}>
                              <Link
                                href={sub.href}
                                className={`flex items-center gap-2 w-full p-2 rounded text-lg transition-colors ${
                                  isActive(sub.href)
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                    : "hover:bg-sidebar-primary hover:text-sidebar-accent-foreground"
                                }`}
                              >
                                <span>{sub.name}</span>
                              </Link>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.name} className="mb-1">
                    <Link
                      href={item.href || "#"}
                      className={`flex items-center gap-2 w-full p-2 rounded text-lg transition-colors ${
                        isActive(item.href)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
