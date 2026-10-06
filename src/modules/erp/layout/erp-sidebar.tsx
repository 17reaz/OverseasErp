import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useAuth,
} from "@/modules/auth/components/auth-provider";
import { Trash2,Settings,Phone, ChevronDown,
  Check } from "lucide-react";
import { motion } from "motion/react";
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
import {
  getActionBadgeCount,
  getActionBadgeCounts,
} from "@/modules/erp/action-center/badge-service";
import type {
  ActionBadgeCounts,
} from "@/modules/erp/action-center/badge-service";
import { usePermissions } from "@/lib/permissions/use-permissions";
// =====================================================
// ERP SIDEBAR
// =====================================================
 const planLabels: Record<string, string> = {
  early_access: "Early Access",
  monthly: "Pro",
  yearly: "Pro",
  lifetime: "Lifetime",
  free_trial: "Free Trial",
};
const workspaces = [
  {
    id: "saudi-arabia",
    name: "Saudi Arabia",
    shortName: "KSA",
    flag: "🇸🇦",
  },
  {
    id: "malaysia",
    name: "Malaysia",
    shortName: "Malaysia",
    flag: "🇲🇾",
  },
  {
    id: "lebanon",
    name: "Lebanon",
    shortName: "Lebanon",
    flag: "🇱🇧",
  },
];
export function ErpSidebar() {
  const { tenant } = useAuth();
  const {can, canAccessPath } = usePermissions();
const visibleNavigation = erpNavigation.filter((item) =>
  canAccessPath(item.url),
);

   const tenantSerial =
     tenant?.sl != null
       ? `${String(tenant.sl).padStart(3, "0")}`
       : "---";
     const planLabel =
    tenant?.access_type
      ? (planLabels[tenant.access_type] ?? tenant.access_type)
      : "—";
   const [
    badgeCounts,
    setBadgeCounts,
  ] = useState<ActionBadgeCounts>({});

  const loadBadges = useCallback(
    async () => {
      const counts =
        await getActionBadgeCounts();

      setBadgeCounts(counts);
    },
    [],
  );
const [
  activeWorkspace,
  setActiveWorkspace,
] = useState(workspaces[0]);

const [
  workspaceOpen,
  setWorkspaceOpen,
] = useState(false);
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const counts =
        await getActionBadgeCounts();

      if (mounted) {
        setBadgeCounts(counts);
      }
    };

    void load();

    const handleUpdate = () => {
      void loadBadges();
    };

    window.addEventListener(
      "overseas-erp:actions-updated",
      handleUpdate,
    );

    const interval = window.setInterval(
      () => {
        void loadBadges();
      },
      30_000,
    );

    return () => {
      mounted = false;

      window.removeEventListener(
        "overseas-erp:actions-updated",
        handleUpdate,
      );

      window.clearInterval(interval);
    };
  }, [loadBadges]);

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
{/* =================================================
    WORKSPACE SELECTOR
    ================================================= */}

{/* =================================================
    WORKSPACE SELECTOR
    ================================================= */}

<div className="px-2 pb-2">

  <div className="relative">

    <button
      type="button"
      onClick={() =>
        setWorkspaceOpen((open) => !open)
      }
      className="
        flex
        h-9
        w-full
        items-center
        gap-2
        rounded-md
        px-2
        text-left
        text-sm
        transition-colors
        hover:bg-muted
        group-data-[collapsible=icon]:justify-center
      "
    >

      <span
        className="
          flex
          h-6
          w-6
          shrink-0
          items-center
          justify-center
          text-base
        "
      >
        {activeWorkspace.flag}
      </span>

      <span
        className="
          min-w-0
          flex-1
          truncate
          font-medium
          group-data-[collapsible=icon]:hidden
        "
      >
        {activeWorkspace.name}
      </span>

      <ChevronDown
        className="
          h-3.5
          w-3.5
          shrink-0
          text-muted-foreground
          group-data-[collapsible=icon]:hidden
        "
      />

    </button>

    {workspaceOpen && (
      <div
        className="
          absolute
          left-0
          right-0
          top-full
          z-50
          mt-1
          rounded-md
          border
          bg-popover
          p-1
          shadow-md
          group-data-[collapsible=icon]:left-10
          group-data-[collapsible=icon]:right-auto
          group-data-[collapsible=icon]:w-48
        "
      >

        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            onClick={() => {
              setActiveWorkspace(workspace);
              setWorkspaceOpen(false);
            }}
            className="
              flex
              h-8
              w-full
              items-center
              gap-2
              rounded-sm
              px-2
              text-left
              text-sm
              hover:bg-muted
            "
          >

            <span className="text-base">
              {workspace.flag}
            </span>

            <span className="min-w-0 flex-1 truncate">
              {workspace.name}
            </span>

            {activeWorkspace.id === workspace.id && (
              <Check className="h-3.5 w-3.5 shrink-0" />
            )}

          </button>
        ))}

      </div>
    )}

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

            <SidebarGroupContent>

              <SidebarMenu>

                {visibleNavigation.map(
  (
    item,
  ) => {
    const badge = getActionBadgeCount(
      badgeCounts,
      item.url,
    );

    return (
      <SidebarMenuItem
        key={item.url}
      >
        <SidebarMenuButton
          asChild
          tooltip={item.title}
        >
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

                {badge > 0 && (
  <motion.span
    key={badge}
    initial={{
      scale: 0.65,
      opacity: 0,
    }}
    animate={{
      scale: 1,
      opacity: 1,
    }}
    transition={{
      type: "spring",
      stiffness: 500,
      damping: 24,
      mass: 0.6,
    }}
    className="
      ml-auto
      flex
      h-5
      min-w-5
      shrink-0
      items-center
      justify-center
      rounded-full
      bg-foreground
      px-1.5
      text-[10px]
      font-semibold
      leading-none
      text-background
      group-data-[collapsible=icon]:absolute
      group-data-[collapsible=icon]:right-1
      group-data-[collapsible=icon]:top-1/2
      group-data-[collapsible=icon]:-translate-y-1/2
    "
    aria-label={`${badge} pending actions`}
  >
    {badge > 99 ? "99+" : badge}
  </motion.span>
)}
              </>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  },
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
{can("trash.view") && (
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
    )}
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
 {planLabel} · {tenantSerial}              </div>

                           <div
                className="
                  mt-1
                  truncate
                  text-[11px]
                  text-muted-foreground
                "
              >
                Commit {__COMMIT_HASH__}
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
                title={`${planLabel} · ${tenantSerial}`}
              >
                {tenantSerial}
              </span>

            </div>

          </SidebarFooter>


      </Sidebar>

    </TooltipProvider>

  );
}