import {
  LayoutDashboard,
  Users,
  UserRoundCog,
  Building2,
  Stethoscope,
  FileCheck,
  Plane,
  ShieldCheck,
  Files,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { NavLink } from "react-router-dom";

const navigation = [
  {
    title: "Dashboard",
    url: "/app",
    icon: LayoutDashboard,
  },
  {
    title: "Candidates",
    url: "/app/candidates",
    icon: Users,
  },
  {
    title: "Agents",
    url: "/app/agents",
    icon: UserRoundCog,
  },
  {
    title: "Agencies",
    url: "/app/agencies",
    icon: Building2,
  },
  {
    title: "Medical",
    url: "/app/medical",
    icon: Stethoscope,
  },
  {
    title: "MOFA",
    url: "/app/mofa",
    icon: FileCheck,
  },
  {
    title: "Visa",
    url: "/app/visa",
    icon: ShieldCheck,
  },
  {
    title: "Takamul",
    url: "/app/takamul",
    icon: Plane,
  },
  {
    title: "Files",
    url: "/app/files",
    icon: Files,
  },
];

export function ErpSidebar() {
  return (
    <Sidebar>
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <div>
          <h1 className="text-sm font-semibold">
            Overseas ERP
          </h1>

          <p className="text-xs text-muted-foreground">
            Management System
          </p>
        </div>
      </div>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            ERP Modules
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/app"}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon />

                          <span
                            className={
                              isActive
                                ? "font-medium"
                                : ""
                            }
                          >
                            {item.title}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}