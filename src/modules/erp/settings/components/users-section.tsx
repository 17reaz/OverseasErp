import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Check,
  Clipboard,
  Loader2,
  Mail,
  Send,
  UserRound,
  Users,
  X,
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
  createTenantInvitation,
  getTenantInvitations,
  getTenantMembers,
  revokeTenantInvitation,
  type InvitationRole,
  type TenantInvitation,
  type TenantMember,
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


function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}


function isExpired(
  value: string,
) {
  return new Date(value).getTime() <= Date.now();
}


function getInvitationLink(
  token: string,
) {
  return `${window.location.origin}/accept-invite?token=${encodeURIComponent(
    token,
  )}`;
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


function InvitationRow({
  invitation,
  onRevoked,
}: {
  invitation: TenantInvitation;
  onRevoked: () => void;
}) {
  const [copying, setCopying] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [revoking, setRevoking] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const expired =
    isExpired(invitation.expires_at);


  const handleCopy = async () => {
    try {
      setCopying(true);
      setError(null);

      const link =
        getInvitationLink(
          invitation.token,
        );

      await navigator.clipboard.writeText(
        link,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to copy invitation link.",
      );
    } finally {
      setCopying(false);
    }
  };


  const handleRevoke = async () => {
    const confirmed =
      window.confirm(
        `Revoke the invitation for ${invitation.email}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setRevoking(true);
      setError(null);

      await revokeTenantInvitation(
        invitation.id,
      );

      onRevoked();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to revoke invitation.",
      );
    } finally {
      setRevoking(false);
    }
  };


  return (
    <div className="border-b px-4 py-4 last:border-b-0">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <Mail className="size-4 shrink-0 text-muted-foreground" />

            <p className="truncate text-sm font-medium">
              {invitation.email}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(
                invitation.role,
              )}`}
            >
              {getRoleLabel(
                invitation.role,
              )}
            </span>

            <span
              className={
                expired
                  ? "text-xs text-destructive"
                  : "text-xs text-muted-foreground"
              }
            >
              {expired
                ? "Expired"
                : `Expires ${formatDate(
                    invitation.expires_at,
                  )}`}
            </span>

          </div>
        </div>


        <div className="flex shrink-0 items-center gap-2">

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void handleCopy();
            }}
            disabled={copying || revoking}
          >
            {copying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : copied ? (
              <Check className="size-4" />
            ) : (
              <Clipboard className="size-4" />
            )}

            {copied
              ? "Copied"
              : "Copy Link"}
          </Button>


          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void handleRevoke();
            }}
            disabled={revoking || copying}
          >
            {revoking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}

            Revoke
          </Button>

        </div>

      </div>


      {error ? (
        <p className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

    </div>
  );
}


export function UsersSection() {
  const [members, setMembers] =
    useState<TenantMember[]>([]);

  const [invitations, setInvitations] =
    useState<TenantInvitation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<InvitationRole>("STAFF");

  const [inviting, setInviting] =
    useState(false);

  const [inviteError, setInviteError] =
    useState<string | null>(null);

  const [inviteSuccess, setInviteSuccess] =
    useState<string | null>(null);


  const loadData =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          memberData,
          invitationData,
        ] = await Promise.all([
          getTenantMembers(),
          getTenantInvitations(),
        ]);

        setMembers(memberData);
        setInvitations(invitationData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load team data.",
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    void loadData();
  }, [loadData]);


  const handleInvite =
    async () => {
      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        setInviteError(
          "Email is required.",
        );
        setInviteSuccess(null);
        return;
      }

      setInviting(true);
      setInviteError(null);
      setInviteSuccess(null);

      try {
        await createTenantInvitation({
          email: cleanEmail,
          role,
        });

        setEmail("");

        setInviteSuccess(
          `Invitation created for ${cleanEmail}.`,
        );

        await loadData();
      } catch (err) {
        setInviteError(
          err instanceof Error
            ? err.message
            : "Failed to create invitation.",
        );
      } finally {
        setInviting(false);
      }
    };


  const handleInvitationRevoked =
    async () => {
      await loadData();
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


      {/* Invite User */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="size-4" />
            Invite User
          </CardTitle>

          <CardDescription>
            Invite a person to join this workspace.
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
                  setInviteError(null);
                  setInviteSuccess(null);
                }}
                disabled={inviting}
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
                  setInviteError(null);
                  setInviteSuccess(null);
                }}
                disabled={inviting}
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
                  void handleInvite();
                }}
                disabled={
                  inviting ||
                  !email.trim()
                }
              >
                {inviting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Inviting...
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


          {inviteError ? (
            <p className="mt-3 text-sm text-destructive">
              {inviteError}
            </p>
          ) : null}


          {inviteSuccess ? (
            <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
              {inviteSuccess}
            </p>
          ) : null}

        </CardContent>
      </Card>


      {/* Pending Invitations */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4" />
            Pending Invitations
          </CardTitle>

          <CardDescription>
            Invitations that have not been accepted
            yet.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">

          {loading ? (
            <div className="flex min-h-32 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading invitations...
              </div>
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center px-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Mail className="size-5 text-muted-foreground" />
              </div>

              <p className="mt-3 text-sm font-medium">
                No pending invitations
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                New invitations will appear here.
              </p>
            </div>
          ) : (
            <div>
              {invitations.map(
                (invitation) => (
                  <InvitationRow
                    key={invitation.id}
                    invitation={invitation}
                    onRevoked={
                      handleInvitationRevoked
                    }
                  />
                ),
              )}
            </div>
          )}

        </CardContent>
      </Card>


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