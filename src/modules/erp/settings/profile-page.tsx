import { useMemo } from "react";
import { Mail, Shield, UserRound } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/modules/auth/components/auth-provider";

export function ProfilePage() {
  const { user, profile } = useAuth();

  const fullName =
    profile?.full_name || user?.email?.split("@")[0] || "User";

  const initials = useMemo(
    () =>
      fullName
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [fullName],
  );

  return (
    <div className="min-h-full p-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account information and access details.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="text-base font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{fullName}</CardTitle>
                <CardDescription>
                  {profile?.role || "User"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <UserRound className="size-4" />
                Full name
              </div>
              <p className="text-sm text-muted-foreground">{fullName}</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Mail className="size-4" />
                Email
              </div>
              <p className="break-all text-sm text-muted-foreground">
                {user?.email || "—"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Shield className="size-4" />
                Role
              </div>
              <p className="text-sm text-muted-foreground">
                {profile?.role || "User"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
