import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

function App() {
  const [user, setUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Check existing session
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();

    // Listen for login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login
  const login = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Login successful!");
    }

    setLoading(false);
  };

  // Signup
  const signup = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else if (data.user) {
      setMessage(
        "Signup successful. Check your email if verification is required."
      );
    }

    setLoading(false);
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Logged in
  if (user) {
    return (
      <div style={{ maxWidth: 400, margin: "100px auto" }}>
        <h1>Dashboard</h1>

        <p>
          Logged in as:
          <br />
          <strong>{user.email}</strong>
        </p>

        <button onClick={logout}>
          Logout
        </button>
      </div>
    );
  }

  // Login / Signup
  return (
    <div style={{ maxWidth: 400, margin: "100px auto" }}>
      <h1>Supabase Auth</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />
      <br />

      <button
        onClick={login}
        disabled={loading}
      >
        {loading ? "Loading..." : "Login"}
      </button>

      {" "}

      <button
        onClick={signup}
        disabled={loading}
      >
        Signup
      </button>

      {message && (
        <p>{message}</p>
      )}
    </div>
  );
}

export default App;