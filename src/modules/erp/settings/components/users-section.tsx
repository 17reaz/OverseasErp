import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Loader2,
  Mail,
  UserRound,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  getTenantMembers,
  type TenantMember,
} from "@/modules/auth/invitations/invitation-service";


function getRoleLabel(role: TenantMember["role"]) {
  switch (role) {
    case "OWNER":
      return "Owner";

    case "ADMIN":
      return "Admin";

    case "MANAGER":
      return "Manager";

    case "STAFF":
      return "Staff";

    default:
      return role;
  }
}


function getRoleBadgeClass(
  role: TenantMember["role"],
) {
  switch (role) {
    case "OWNER":
      return "bg-primary/10 text-primary";

    case "ADMIN":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";

    case "MANAGER":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";

    case "STAFF":
      return "bg-muted text-muted-foreground";

    default:
      return "bg-muted text-muted-foreground";
  }
}


function getMemberName(member: TenantMember) {
  return (
    member.full_name?.trim() ||
    member.email?.split("@")[0] ||
    "Unknown user"
  );
}


function MemberRow({
  member,
}: {
  member: TenantMember;
}) {
  const name = getMemberName(member);

  return (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted">
          <UserRound className="size-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {name}
          </p>

          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="size-3 shrink-0" />

            <span className="truncate">
              {member.email || "No email"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(
            member.role,
          )}`}
        >
          {getRoleLabel(member.role)}
        </span>

        <span
          className={
            member.is_active
              ? "text-xs text-emerald-600 dark:text-emerald-400"
              : "text-xs text-muted-foreground"
          }
        >
          {member.is_active
            ? "Active"
            : "Inactive"}
        </span>
      </div>
    </div>
  );
}


export function UsersSection() {
  const [members, setMembers] = useState<TenantMember[]>(
    [],
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );


  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getTenantMembers();

      setMembers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load team members.",
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Team Members
        </h2>

        <p className="text-sm text-muted-foreground">
          Manage people who have access to this
          workspace.
        </p>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />

            Members
          </CardTitle>

          <CardDescription>
            Users currently belonging to your active
            workspace.
          </CardDescription>
        </CardHeader>


        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />

                Loading team members...
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-40 items-center justify-center px-6 text-center">
              <div>
                <p className="text-sm font-medium text-destructive">
                  Failed to load team members
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {error}
                </p>
              </div>
            </div>
          ) : members.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Users className="size-5 text-muted-foreground" />
              </div>

              <p className="mt-3 text-sm font-medium">
                No team members found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Team members will appear here.
              </p>
            </div>
          ) : (
            <div>
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}