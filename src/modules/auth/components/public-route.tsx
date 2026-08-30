import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "@/modules/auth/components/auth-provider";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({
  children,
}: PublicRouteProps) {
  const {
    session,
    loading,
  } = useAuth();

  const location = useLocation();

  /*
   * IMPORTANT:
   *
   * Do not redirect while Supabase is restoring
   * the persisted session.
   */
  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
        "
      >
        Loading...
      </div>
    );
  }

  /*
   * Session exists.
   *
   * User is already logged in, therefore
   * public pages should not be shown.
   */
  if (session) {
    return (
      <Navigate
        to="/app/dashboard"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  /*
   * No session.
   *
   * Landing/Login page can be shown.
   */
  return <>{children}</>;
}