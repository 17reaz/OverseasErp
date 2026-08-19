import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { signIn, signInWithGoogle } from "@/lib/supabase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Globe2, Loader2 } from "lucide-react";

// If your app has a shared routes file (like the landing module's
// site-routes.ts), swap this literal for that constant instead.
const SIGNUP_ROUTE = "/signup";

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate("/app", { replace: true });
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark — same as navbar */}
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
            Login to your agency
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage candidates, agents, and deployments in one place.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@agency.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || googleLoading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading || googleLoading}
              onClick={handleGoogleLogin}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              {googleLoading ? "Connecting to Google..." : "Continue with Google"}
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an agency account?{" "}
          <Link
            to={SIGNUP_ROUTE}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Get Started
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.54-5.17 3.54-8.89Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.92l-3.88-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.29v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.29a12 12 0 0 0 0 10.76l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l4 3.11C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}