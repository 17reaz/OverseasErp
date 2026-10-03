import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { signUp } from "@/lib/supabase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Globe2, Loader2 } from "lucide-react";

const LOGIN_ROUTE = "/login";

export function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const invitationToken = searchParams.get("token")?.trim() || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { data, error } = await signUp(
      email,
      password,
      invitationToken || undefined,
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    /*
     * If Supabase returns a session immediately,
     * AuthProvider will load the profile/workspace.
     */
    if (data.session) {
      navigate("/app", { replace: true });
      return;
    }

    setLoading(false);

    /*
     * Email confirmation is enabled.
     *
     * Keep the invitation token when redirecting to login
     * so the user can continue the invitation flow.
     */
    if (invitationToken) {
      navigate(
        `/login?redirect=${encodeURIComponent(
          `/accept-invite?token=${invitationToken}`,
        )}`,
        { replace: true },
      );
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Globe2 className="h-4.5 w-4.5" />
            </span>

            <span className="text-base font-semibold tracking-tight text-foreground">
              OverseasERP
            </span>
          </Link>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
            {invitationToken
              ? "Join your workspace"
              : "Create your agency account"}
          </h1>

          <p className="mt-1.5 text-sm text-muted-foreground">
            {invitationToken
              ? "Create your account to join the invited workspace."
              : "Start tracking candidates, agents, and deployments today."}
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email
                </Label>

                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@agency.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">
                  Password
                </Label>

                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              {invitationToken && (
                <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                  You have been invited to join a workspace.
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {loading
                  ? "Creating account..."
                  : invitationToken
                    ? "Join workspace"
                    : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an agency account?{" "}

          <Link
            to={
              invitationToken
                ? `/login?redirect=${encodeURIComponent(
                    `/accept-invite?token=${invitationToken}`,
                  )}`
                : LOGIN_ROUTE
            }
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
