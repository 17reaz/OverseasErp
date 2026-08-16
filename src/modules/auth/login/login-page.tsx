import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { signIn } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
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

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="Email"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="Password"
          required
        />

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />

        <span className="text-xs text-muted-foreground">
          OR
        </span>

        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
        className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
      >
        {googleLoading
          ? "Connecting to Google..."
          : "Continue with Google"}
      </button>
    </div>
  );
}