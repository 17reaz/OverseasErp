import { useEffect, useState } from "react";
import { Mail, UserRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
}

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !mounted) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      setProfile({
        full_name:
          data?.full_name ??
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "",
        email: user.email ?? "",
        phone: data?.phone ?? "",
        avatar_url:
          data?.avatar_url ??
          user.user_metadata?.avatar_url ??
          "",
      });

      setLoading(false);
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  const initials =
    profile.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal account information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Personal information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border bg-muted text-lg font-semibold">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Profile"}
                  className="size-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div>
              <p className="font-medium">
                {profile.full_name || "Your profile"}
              </p>

              <p className="text-sm text-muted-foreground">
                Account profile
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>

              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={profile.full_name}
                  readOnly
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={profile.email}
                  readOnly
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>

              <Input
                value={profile.phone}
                readOnly
                placeholder="Not added"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}