import {
  Bell,
  LogOut,
  Search,
  User,
  Settings,
  Plus,
  UserPlus,
  Stethoscope,
  FileText,
  CreditCard,
  Plane,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

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

  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    profile,
  } = useAuth();


  // =====================================================
  // PAGE NAME
  // =====================================================

  function getPageName(pathname: string) {

    if (pathname.includes("/candidates")) {
      return "Candidates";
    }

    if (pathname.includes("/medicals")) {
      return "Medical";
    }

    if (pathname.includes("/mofas")) {
      return "MOFA";
    }

    if (pathname.includes("/documents")) {
      return "Documents";
    }

    if (pathname.includes("/visas")) {
      return "Visa";
    }

    if (pathname.includes("/flights")) {
      return "Flight";
    }

    if (pathname.includes("/settings")) {
      return "Settings";
    }

    if (pathname.includes("/profile")) {
      return "Profile";
    }

    if (pathname.includes("/dashboard")) {
      return "Dashboard";
    }

    return "Dashboard";
  }

  const pageName =
    getPageName(location.pathname);


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
        w-full
        items-center
        justify-between
        border-b
        bg-background
        px-4
        md:px-6
      "
    >

      {/* =================================================
        LEFT
        ================================================= */}

      <div
        className="
          flex
          min-w-0
          items-center
          gap-3
        "
      >

        {/* =================================================
            SIDEBAR TOGGLE
            ================================================= */}

        <SidebarTrigger
          className="
            shrink-0
            -ml-2
          "
        />


        {/* =================================================
            PAGE NAME
            ================================================= */}

        <div
          className="
            min-w-0
          "
        >

          <h1
            className="
              truncate
              text-sm
              font-semibold
              md:text-base
            "
          >
            {pageName}
          </h1>

        </div>

      </div>


      {/* =================================================
        RIGHT
        ================================================= */}

      <div
        className="
          flex
          items-center
          gap-1
          md:gap-2
        "
      >

        {/* =================================================
            GLOBAL SEARCH
            ================================================= */}

        <Button
          variant="outline"
          className="
            hidden
            h-9
            w-[220px]
            justify-start
            gap-2
            px-3
            text-muted-foreground
            lg:flex
          "
          onClick={() => {
            // Global search action will be added later
          }}
        >

          <Search
            className="
              h-4
              w-4
              shrink-0
            "
          />

          <span
            className="
              text-sm
            "
          >
            Search...
          </span>

          <kbd
            className="
              ml-auto
              hidden
              rounded
              border
              bg-muted
              px-1.5
              py-0.5
              text-[10px]
              font-medium
              text-muted-foreground
            "
          >
            Ctrl K
          </kbd>

        </Button>


        {/* =================================================
            MOBILE SEARCH
            ================================================= */}

        <Button
          variant="ghost"
          size="icon"
          className="
            lg:hidden
          "
          aria-label="Search"
          onClick={() => {
            // Mobile search action will be added later
          }}
        >

          <Search
            className="
              h-4
              w-4
            "
          />

        </Button>


        {/* =================================================
            NOTIFICATION
            ================================================= */}

        <Button
          variant="ghost"
          size="icon"
          className="
            relative
          "
          aria-label="Notifications"
          onClick={() => {
            // Notification module will be connected later
          }}
        >

          <Bell
            className="
              h-4
              w-4
            "
          />

          {/* Unread notification indicator */}

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
                  shrink-0
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
                    max-w-[120px]
                    truncate
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
              PROFILE DROPDOWN
              ================================================= */}

          <DropdownMenuContent
            align="end"
            className="
              w-64
            "
          >

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


            {/* PROFILE */}

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


            {/* SETTINGS */}

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


            {/* LOGOUT */}

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


        {/* =================================================
            GLOBAL ADD
            ================================================= */}

        <DropdownMenu>

          <DropdownMenuTrigger asChild>

            <Button
              variant="outline"
              size="icon"
              className="
                h-9
                w-9
              "
              aria-label="Global Add"
            >

              <Plus
                className="
                  h-4
                  w-4
                "
              />

            </Button>

          </DropdownMenuTrigger>


          <DropdownMenuContent
            align="end"
            className="
              w-48
            "
          >

            <DropdownMenuLabel>
              Quick Add
            </DropdownMenuLabel>

            <DropdownMenuSeparator />


            <DropdownMenuItem
              onClick={() =>
                navigate(
                  "/app/candidates/new",
                )
              }
            >

              <UserPlus
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Candidate

            </DropdownMenuItem>


            <DropdownMenuItem
              onClick={() =>
                navigate(
                  "/app/medicals/new",
                )
              }
            >

              <Stethoscope
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Medical

            </DropdownMenuItem>


            <DropdownMenuItem
              onClick={() =>
                navigate(
                  "/app/mofas/new",
                )
              }
            >

              <FileText
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              MOFA

            </DropdownMenuItem>


            <DropdownMenuItem
              onClick={() =>
                navigate(
                  "/app/visas/new",
                )
              }
            >

              <CreditCard
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Visa

            </DropdownMenuItem>


            <DropdownMenuItem
              onClick={() =>
                navigate(
                  "/app/flights/new",
                )
              }
            >

              <Plane
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Flight

            </DropdownMenuItem>

          </DropdownMenuContent>

        </DropdownMenu>

      </div>

    </header>

  );
}