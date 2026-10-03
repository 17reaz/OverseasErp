import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Check,
  Clipboard,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Send,
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

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createWorkspaceUser,
  getTenantMembers,
  type InvitationRole,
  type TenantMember,
  type CreateWorkspaceUserResult,
} from "@/modules/auth/invitations/invitation-service";


function getRoleLabel(
  role: TenantMember["role"] | InvitationRole,
) {
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
  role: TenantMember["role"] | InvitationRole,
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


function getMemberName(
  member: TenantMember,
) {
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


function TemporaryPasswordCard({
  result,
  onClose,
}: {
  result: CreateWorkspaceUserResult;
  onClose: () => void;
}) {
  const [copied, setCopied] =
    useState(false);

  const [visible, setVisible] =
    useState(true);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        result.temporaryPassword,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="size-4" />

          User Created
        </CardTitle>

        <CardDescription>
          Give this temporary password to the user
          securely. It will not be shown again after
          leaving this screen.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-background p-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Email
            </p>

            <p className="break-all text-sm font-medium">
              {result.user.email}
            </p>
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-xs text-muted-foreground">
              Role
            </p>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(
                result.user.role,
              )}`}
            >
              {getRoleLabel(result.user.role)}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Temporary Password
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center rounded-md border bg-muted/40 px-3">
                <code className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide">
                  {visible
                    ? result.temporaryPassword
                    : "••••••••••••••••"}
                </code>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-2 shrink-0"
                  onClick={() => {
                    setVisible((current) => !current);
                  }}
                  title={
                    visible
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {visible ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void handleCopy();
                }}
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Clipboard className="size-4" />
                )}

                {copied
                  ? "Copied"
                  : "Copy Password"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
            For security, share this temporary password
            directly with the user. Do not store it in
            notes, chat history, or other shared locations.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


export function UsersSection() {
  const [members, setMembers] =
    useState<TenantMember[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<InvitationRole>("STAFF");

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState<string | null>(null);

  const [createdUser, setCreatedUser] =
    useState<CreateWorkspaceUserResult | null>(
      null,
    );


  const loadMembers =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const memberData =
          await getTenantMembers();

        setMembers(memberData);
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


  const handleCreateUser =
    async () => {
      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        setCreateError(
          "Email is required.",
        );
        return;
      }

      setCreating(true);
      setCreateError(null);
      setCreatedUser(null);

      try {
        const result =
          await createWorkspaceUser({
            email: cleanEmail,
            role,
          });

        setCreatedUser(result);
        setEmail("");

        await loadMembers();
      } catch (err) {
        setCreateError(
          err instanceof Error
            ? err.message
            : "Failed to create user.",
        );
      } finally {
        setCreating(false);
      }
    };


  const handleCreatedUserClose =
    () => {
      setCreatedUser(null);
      setCreateError(null);
    };


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


      {/* Create User */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="size-4" />
            Invite User
          </CardTitle>

          <CardDescription>
            Create a user account and give them the
            temporary password to sign in.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]">

            <div className="space-y-2">
              <label
                htmlFor="invite-email"
                className="text-sm font-medium"
              >
                Email
              </label>

              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setCreateError(null);
                  setCreatedUser(null);
                }}
                disabled={creating}
              />
            </div>


            <div className="space-y-2">
              <label className="text-sm font-medium">
                Role
              </label>

              <Select
                value={role}
                onValueChange={(value) => {
                  setRole(
                    value as InvitationRole,
                  );
                  setCreateError(null);
                  setCreatedUser(null);
                }}
                disabled={creating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ADMIN">
                    Admin
                  </SelectItem>

                  <SelectItem value="MANAGER">
                    Manager
                  </SelectItem>

                  <SelectItem value="STAFF">
                    Staff
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="flex items-end">
              <Button
                type="button"
                className="w-full md:w-auto"
                onClick={() => {
                  void handleCreateUser();
                }}
                disabled={
                  creating ||
                  !email.trim()
                }
              >
                {creating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Invite User
                  </>
                )}
              </Button>
            </div>

          </div>


          {createError ? (
            <p className="mt-3 text-sm text-destructive">
              {createError}
            </p>
          ) : null}

        </CardContent>
      </Card>


      {/* Temporary Password */}

      {createdUser ? (
        <TemporaryPasswordCard
          result={createdUser}
          onClose={handleCreatedUserClose}
        />
      ) : null}


      {/* Members */}

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