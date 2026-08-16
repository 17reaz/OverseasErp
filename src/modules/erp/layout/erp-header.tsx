import { Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { signOut } from "@/lib/supabase/auth";

export function ErpHeader() {
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await signOut();

    if (error) {
      console.error("Logout failed:", error);
      return;
    }

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <h2 className="text-sm font-medium">
          Overseas ERP
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
        >
          <User className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}