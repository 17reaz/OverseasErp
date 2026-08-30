import { Trash2,Settings,Phone } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

import {
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  NavLink,
} from "react-router-dom";

// =====================================================
// NAVIGATION
// =====================================================

import {
  erpNavigation,
} from "./erp-navigation";

// =====================================================
// ERP SIDEBAR
// =====================================================

export function ErpSidebar() {

  return (

    <TooltipProvider>

      <Sidebar
        collapsible="icon"
      >

        {/* =================================================
            HEADER
            ================================================= */}

        <SidebarHeader>

          <div
            className="
              flex
              h-16
              items-center
              px-2
              group-data-[collapsible=icon]:justify-center
            "
          >

            {/* Expanded logo/title */}

            <div
              className="
                min-w-0
                group-data-[collapsible=icon]:hidden
              "
            >

              <h1
                className="
                  truncate
                  text-sm
                  font-semibold
                "
              >
                Overseas ERP
              </h1>

              <p
                className="
                  truncate
                  text-xs
                  text-muted-foreground
                "
              >
                Management System
              </p>

            </div>


            {/* Collapsed logo */}

            <div
              className="
                hidden
                text-sm
                font-bold
                group-data-[collapsible=icon]:block
              "
            >
              OE
            </div>

          </div>

        </SidebarHeader>


        {/* =================================================
            CONTENT
            ================================================= */}

        <SidebarContent className="flex-1 overflow-auto">

          {/* =================================================
              MAIN NAVIGATION
              ================================================= */}

          <SidebarGroup>

            <SidebarGroupLabel
              className="
                group-data-[collapsible=icon]:hidden
              "
            >
              ERP Modules
            </SidebarGroupLabel>


            <SidebarGroupContent>

              <SidebarMenu>

                {erpNavigation.map(
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
                        tooltip={
                          item.title
                        }
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
                    tooltip="Call Support"
                  >

                    <a
                      href="tel:+8801839869859"
                    >

                      <Phone />

                      <span>
                        01839869859
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
                    tooltip="Settings"
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
                    tooltip="Trash"
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
          </SidebarContent>

          <SidebarFooter
            className="
              border-t
              px-4
              py-3
              group-data-[collapsible=icon]:px-2
            "
          >

            {/* Expanded */}

            <div
              className="
                group-data-[collapsible=icon]:hidden
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


            {/* Collapsed */}

            <div
              className="
                hidden
                items-center
                justify-center
                group-data-[collapsible=icon]:flex
              "
            >

              <span
                className="
                  text-xs
                  font-semibold
                "
                title="Pro · TEN-0001"
              >
                P
              </span>

            </div>

          </SidebarFooter>


      </Sidebar>

    </TooltipProvider>

  );
}