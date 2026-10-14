import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Mail, Phone, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";

import {
  SettingsCard,
  SettingsPageHeader,
  SettingsSection,
} from "./components/settings-ui";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
}

/* -------------------------------------------------------------------------- */
/* Small presentational pieces                                                */
/* -------------------------------------------------------------------------- */

function PageHeading() {
  return (
    <SettingsPageHeader
      icon={UserRound}
      title="Profile"
      description="Manage your personal account information."
    />
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 px-5 py-3 sm:grid-cols-3 sm:items-center sm:gap-4">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </dt>
      <dd className="min-w-0 truncate text-sm font-medium sm:col-span-2">
        {children}
      </dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeading />

      <SettingsCard>
        <SettingsSection className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
          </div>
        </SettingsSection>

        <SettingsSection className="space-y-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </SettingsSection>
      </SettingsCard>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: "",
  });

  const [loading, setLoading] = useState(true);

  /* ---- data loading: unchanged ------------------------------------------ */
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
        avatar_url: data?.avatar_url ?? user.user_metadata?.avatar_url ?? "",
      });

      setLoading(false);
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  /* ---- UI ---------------------------------------------------------------- */
  if (loading) return <ProfileSkeleton />;

  const initials =
    profile.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase())
      .join("") || "U";

  const notAdded = (
    <span className="font-normal text-muted-foreground">Not added</span>
  );

  return (
    <div className="space-y-4">
      <PageHeading />

      <SettingsCard>
        {/* Identity */}
        <SettingsSection className="flex items-center gap-4">
          <Avatar className="size-16 border">
            {profile.avatar_url ? (
              <AvatarImage
                src={profile.avatar_url}
                alt={profile.full_name || "Profile"}
              />
            ) : null}
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-base font-semibold">
              {profile.full_name || "Your profile"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {profile.email || "Account profile"}
            </p>
          </div>
        </SettingsSection>

        {/* Details */}
        <SettingsSection flush>
          <dl className="divide-y">
            <DetailRow icon={UserRound} label="Full name">
              {profile.full_name || notAdded}
            </DetailRow>

            <DetailRow icon={Mail} label="Email">
              {profile.email || notAdded}
            </DetailRow>

            <DetailRow icon={Phone} label="Phone">
              {profile.phone || notAdded}
            </DetailRow>
          </dl>
        </SettingsSection>
      </SettingsCard>
    </div>
  );
}
