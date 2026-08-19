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
  Trash2,
  Settings,
  BarChart3,
  WalletCards,
  ListTodo,
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

import {
  NavLink,
} from "react-router-dom";

// =====================================================
// NAVIGATION
// =====================================================

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

  // NEW
  {
    title: "Flight",
    url: "/app/flight",
    icon: Plane,
  },

  // NEW
  {
    title: "Reports",
    url: "/app/reports",
    icon: BarChart3,
  },

  // NEW
  {
    title: "Finance",
    url: "/app/finance",
    icon: WalletCards,
  },

  {
    title: "Files",
    url: "/app/files",
    icon: Files,
  },
  {
  title: "Todo",
  url: "/app/todo",
  icon: ListTodo,
},

];

// =====================================================
// ERP SIDEBAR
// =====================================================

export function ErpSidebar() {

  return (

    <Sidebar>

      {/* =================================================
          HEADER
          ================================================= */}

      <div
        className="
          flex
          h-16
          items-center
          border-b
          px-6
        "
      >

        <div>

          <h1
            className="
              text-sm
              font-semibold
            "
          >
            Overseas ERP
          </h1>

          <p
            className="
              text-xs
              text-muted-foreground
            "
          >
            Management System
          </p>

        </div>

      </div>


      {/* =================================================
          NAVIGATION
          ================================================= */}

      <SidebarContent>

        {/* =================================================
            MAIN NAVIGATION
            ================================================= */}

        <SidebarGroup>

          <SidebarGroupContent>

            <SidebarMenu>

              {navigation.map(
                (
                  item,
                ) => (

                  <SidebarMenuItem
                    key={
                      item.url
                    }
                  >

                    <SidebarMenuButton
                      asChild
                    >

                      <NavLink
                        to={
                          item.url
                        }
                        end={
                          item.url ===
                          "/app"
                        }
                      >

                        {({
                          isActive,
                        }) => (

                          <>

                            <item.icon />

                            <span
                              className={
                                isActive
                                  ? "font-medium"
                                  : ""
                              }
                            >
                              {
                                item.title
                              }
                            </span>

                          </>

                        )}

                      </NavLink>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                ),
              )}

            </SidebarMenu>

          </SidebarGroupContent>

        </SidebarGroup>


        {/* =================================================
            BOTTOM NAVIGATION
            ================================================= */}

        <SidebarGroup
          className="
            mt-auto
          "
        >

          <SidebarGroupContent>

            <SidebarMenu>

              {/* =================================================
                  SUPPORT NUMBER
                  ================================================= */}

              <SidebarMenuItem>

                <SidebarMenuButton
                  asChild
                >

                  <a
                    href="tel:+8801XXXXXXXXX"
                  >

                    <span>
                      +8801839869859
                    </span>

                  </a>

                </SidebarMenuButton>

              </SidebarMenuItem>


              {/* =================================================
                  SETTINGS
                  ================================================= */}

              <SidebarMenuItem>

                <SidebarMenuButton
                  asChild
                >

                  <NavLink
                    to="/app/settings"
                  >

                    {({
                      isActive,
                    }) => (

                      <>

                        <Settings />

                        <span
                          className={
                            isActive
                              ? "font-medium"
                              : ""
                          }
                        >
                          Settings
                        </span>

                      </>

                    )}

                  </NavLink>

                </SidebarMenuButton>

              </SidebarMenuItem>


              {/* =================================================
                  TRASH
                  ================================================= */}

              <SidebarMenuItem>

                <SidebarMenuButton
                  asChild
                >

                  <NavLink
                    to="/app/trash"
                  >

                    {({
                      isActive,
                    }) => (

                      <>

                        <Trash2 />

                        <span
                          className={
                            isActive
                              ? "font-medium"
                              : ""
                          }
                        >
                          Trash
                        </span>

                      </>

                    )}

                  </NavLink>

                </SidebarMenuButton>

              </SidebarMenuItem>

            </SidebarMenu>

          </SidebarGroupContent>

        </SidebarGroup>


        {/* =================================================
            TENANT / PLAN / COMMIT
            ================================================= */}

        <div
          className="
            border-t
            px-4
            py-3
          "
        >

          <div
            className="
              truncate
              text-xs
              font-medium
            "
          >
            Pro · TEN-0001
          </div>

          <div
            className="
              mt-1
              truncate
              text-[11px]
              text-muted-foreground
            "
          >
            Commit 8f3a2c1
          </div>

        </div>

      </SidebarContent>

    </Sidebar>

  );
}