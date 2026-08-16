import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { signUp } from "@/lib/supabase/auth";

export function SignupPage() {
  const navigate = useNavigate();

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
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    /*
     * Depending on Supabase email-confirmation settings,
     * session may be null after signup.
     */
    if (data.session) {
      navigate("/app", { replace: true });
      return;
    }

    setLoading(false);

    // Email confirmation required.
    navigate("/login", { replace: true });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        required
      />

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}