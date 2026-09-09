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
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationCenter } from "@/modules/erp/notifications/notification-center";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/modules/auth/components/auth-provider";
import { erpNavigation } from "./erp-navigation";
import { signOut } from "@/lib/supabase/auth";
import { GlobalSearchDialog } from "../global-search/global-search-dialog";
import {
  getUnreadSystemNotificationCount,
} from "@/modules/erp/notifications/notification-service";
export function ErpHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
 const [notificationOpen,setNotificationOpen] = useState(false);
const [unreadCount,setUnreadCount] = useState(0);
  useEffect(() => {
    function handleGlobalSearchShortcut(event: KeyboardEvent) {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k";

      if (!isShortcut) return;
      event.preventDefault();
      setGlobalSearchOpen(true);
    }

    window.addEventListener("keydown", handleGlobalSearchShortcut);
    return () => window.removeEventListener("keydown", handleGlobalSearchShortcut);
  }, []);
    

 useEffect(() => {
  let mounted = true;

  const loadNotifications = async () => {
    if (!user?.id) {
      if (mounted) {
        setUnreadCount(0);
      }
      return;
    }

    const unread =
      await getUnreadSystemNotificationCount(
        user.id,
      );

    if (!mounted) return;

    setUnreadCount(unread);
  };

  void loadNotifications();

  return () => {
    mounted = false;
  };
}, [user?.id]);





  const currentNavigation = [...erpNavigation]
    .sort((a, b) => b.url.length - a.url.length)
    .find(
      (item) =>
        location.pathname === item.url ||
        location.pathname.startsWith(`${item.url}/`),
    );

  const pageName = currentNavigation?.title ??
    (location.pathname.startsWith("/app/settings") ? "Settings" : "Dashboard");

  async function handleLogout() {
    const { error } = await signOut();
    if (error) {
      console.error("Logout failed:", error);
      return;
    }
    navigate("/login", { replace: true });
  }

  const fullName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const initials = fullName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="flex h-16 w-full items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="-ml-2 shrink-0" />
          <h1 className="truncate text-lg font-semibold md:text-xl">{pageName}</h1>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            type="button"
            variant="outline"
            className="hidden h-9 w-[220px] justify-start gap-2 px-3 text-muted-foreground lg:flex"
            onClick={() => setGlobalSearchOpen(true)}
            aria-label="Open global search"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="text-sm">Search...</span>
            <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Ctrl K
            </kbd>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Search"
            onClick={() => setGlobalSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="relative" 
            aria-label="Notifications"
            onClick={()=>setNotificationOpen(true)}
            >
            <Bell className="h-4 w-4" />
             {unreadCount > 0 && (
              <>
                <span
                  className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"
                  aria-hidden="true"
                />

                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-semibold text-background">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              </>
            )}
            {/* <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" /> */}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" className="flex h-10 items-center gap-2 px-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="max-w-[120px] truncate text-sm font-medium leading-none">{fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{profile?.role || "User"}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{fullName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{email}</span>
                  {profile?.role && (
                    <span className="text-xs font-normal text-muted-foreground">Role: {profile.role}</span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => navigate("/app/settings?section=profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label="Global Add">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Quick Add</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/app/candidates/new")}>
                <UserPlus className="mr-2 h-4 w-4" /> Candidate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/medical")}>
                <Stethoscope className="mr-2 h-4 w-4" /> Medical
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/mofa")}>
                <FileText className="mr-2 h-4 w-4" /> MOFA
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/visa")}>
                <CreditCard className="mr-2 h-4 w-4" /> Visa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/flight")}>
                <Plane className="mr-2 h-4 w-4" /> Flight
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <GlobalSearchDialog open={globalSearchOpen} onOpenChange={setGlobalSearchOpen} />
       <NotificationCenter
        open={notificationOpen}
        onOpenChange={
          setNotificationOpen
        }
        userId={user?.id}
      />
    </>
  );
}
