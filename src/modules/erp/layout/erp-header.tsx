import {
  Bell,
  LogOut,
  User,
  Settings,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Button,
} from "@/components/ui/button";

import {
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  useAuth,
} from "@/modules/auth/components/auth-provider";

import {
  signOut,
} from "@/lib/supabase/auth";

export function ErpHeader() {

  const navigate =
    useNavigate();

  const {
    user,
    profile,
    tenant,
  } = useAuth();


  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout() {

    const {
      error,
    } = await signOut();

    if (error) {

      console.error(
        "Logout failed:",
        error,
      );

      return;
    }

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }


  // =====================================================
  // USER INFO
  // =====================================================

  const fullName =
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const email =
    user?.email || "";

  const initials =
    fullName
      .split(" ")
      .map(
        (name) =>
          name.charAt(0),
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();


  // =====================================================
  // UI
  // =====================================================

  return (

    <header
      className="
        flex
        h-16
        items-center
        justify-between
        border-b
        bg-background
        px-6
      "
    >

      {/* =================================================
          LEFT
          ================================================= */}

      <div
        className="
          flex
          items-center
          gap-3
        "
      >

        {/* Sidebar collapse / expand */}

        <SidebarTrigger
          className="
            -ml-2
          "
        />


        {/* Header title */}

        <div>

          <h2
            className="
              text-sm
              font-semibold
            "
          >
            Overseas ERP
          </h2>


          {tenant && (

            <p
              className="
                text-xs
                text-muted-foreground
              "
            >
              {tenant.name}
            </p>

          )}

        </div>

      </div>


      {/* =================================================
          RIGHT
          ================================================= */}

      <div
        className="
          flex
          items-center
          gap-2
        "
      >

        {/* =================================================
            NOTIFICATION
            ================================================= */}

        <Button
          variant="ghost"
          size="icon"
          className="
            relative
          "
        >

          <Bell
            className="
              h-4
              w-4
            "
          />


          {/* Notification dot */}

          <span
            className="
              absolute
              right-2
              top-2
              h-1.5
              w-1.5
              rounded-full
              bg-red-500
            "
          />

        </Button>


        {/* =================================================
            PROFILE
            ================================================= */}

        <DropdownMenu>

          <DropdownMenuTrigger
            asChild
          >

            <Button
              variant="ghost"
              className="
                flex
                h-10
                items-center
                gap-2
                px-2
              "
            >

              {/* Avatar */}

              <Avatar
                className="
                  h-8
                  w-8
                "
              >

                <AvatarFallback>
                  {initials}
                </AvatarFallback>

              </Avatar>


              {/* Name / Role */}

              <div
                className="
                  hidden
                  text-left
                  md:block
                "
              >

                <p
                  className="
                    text-sm
                    font-medium
                    leading-none
                  "
                >
                  {fullName}
                </p>


                <p
                  className="
                    mt-1
                    text-xs
                    text-muted-foreground
                  "
                >
                  {
                    profile?.role ||
                    "User"
                  }
                </p>

              </div>

            </Button>

          </DropdownMenuTrigger>


          {/* =================================================
              DROPDOWN
              ================================================= */}

          <DropdownMenuContent
            align="end"
            className="
              w-64
            "
          >

            {/* =================================================
                PROFILE INFORMATION
                ================================================= */}

            <DropdownMenuLabel>

              <div
                className="
                  flex
                  flex-col
                  gap-1
                "
              >

                <span
                  className="
                    font-medium
                  "
                >
                  {fullName}
                </span>


                <span
                  className="
                    text-xs
                    font-normal
                    text-muted-foreground
                  "
                >
                  {email}
                </span>


                {profile?.role && (

                  <span
                    className="
                      text-xs
                      font-normal
                      text-muted-foreground
                    "
                  >
                    Role:{" "}
                    {profile.role}
                  </span>

                )}

              </div>

            </DropdownMenuLabel>


            <DropdownMenuSeparator />


            {/* =================================================
                PROFILE
                ================================================= */}

            <DropdownMenuItem
              onClick={() =>
                navigate(
                  "/app/profile",
                )
              }
            >

              <User
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Profile

            </DropdownMenuItem>


            {/* =================================================
                SETTINGS
                ================================================= */}

            <DropdownMenuItem
              onClick={() =>
                navigate(
                  "/app/settings",
                )
              }
            >

              <Settings
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Settings

            </DropdownMenuItem>


            <DropdownMenuSeparator />


            {/* =================================================
                LOGOUT
                ================================================= */}

            <DropdownMenuItem
              onClick={
                handleLogout
              }
              className="
                text-destructive
                focus:text-destructive
              "
            >

              <LogOut
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Logout

            </DropdownMenuItem>

          </DropdownMenuContent>

        </DropdownMenu>

      </div>

    </header>

  );
}