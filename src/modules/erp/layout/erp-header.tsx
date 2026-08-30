import {
  Bell,
  LogOut,
  Search,
  User,
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
  erpNavigation,
} from "./erp-navigation";

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

  /* =======================================================
     CURRENT NAVIGATION

     IMPORTANT:
     Longest matching URL wins.

     Example:
       /app/candidates
       /app/candidates/123

     must match Candidates,
     not Dashboard.
  ======================================================= */

  const currentNavigation = [...erpNavigation]
    .sort(
      (a, b) =>
        b.url.length - a.url.length,
    )
    .find(
      (item) =>
        location.pathname === item.url ||
        location.pathname.startsWith(
          `${item.url}/`,
        ),
    );

  const pageName =
    currentNavigation?.title ??
    "Dashboard";



  /* =======================================================
     LOGOUT
  ======================================================= */

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


  /* =======================================================
     USER INFO
  ======================================================= */

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


  /* =======================================================
     UI
  ======================================================= */

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

        <SidebarTrigger
          className="
            shrink-0
            -ml-2
          "
        />

        {/* =================================================
            CURRENT SIDEBAR NAVIGATION
        ================================================= */}

        <div
  className="
    flex
    min-w-0
    items-center
  "
>
  <h1
    className="
      truncate
      text-lg
      font-semibold
      md:text-xl
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
            // Global search action
          }}
        >

          <Search
            className="
              h-4
              w-4
              shrink-0
            "
          />

          <span className="text-sm">
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
          className="lg:hidden"
          aria-label="Search"
          onClick={() => {
            // Mobile search action
          }}
        >
          <Search className="h-4 w-4" />
        </Button>


        {/* =================================================
            NOTIFICATION
        ================================================= */}

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
          onClick={() => {
            // Notification action
          }}
        >

          <Bell className="h-4 w-4" />

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

          <DropdownMenuTrigger asChild>

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
                  {profile?.role || "User"}
                </p>

              </div>

            </Button>

          </DropdownMenuTrigger>


          <DropdownMenuContent
            align="end"
            className="w-64"
          >

            <DropdownMenuLabel>

              <div
                className="
                  flex
                  flex-col
                  gap-1
                "
              >

                <span className="font-medium">
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
                    Role: {profile.role}
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
            <DropdownMenuSeparator />


            {/* LOGOUT */}

            <DropdownMenuItem
              onClick={handleLogout}
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
              <Plus className="h-4 w-4" />
            </Button>

          </DropdownMenuTrigger>


          <DropdownMenuContent
            align="end"
            className="w-48"
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
                  "/app/medical",
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
                  "/app/mofa",
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
                  "/app/visa",
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
                  "/app/flight",
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