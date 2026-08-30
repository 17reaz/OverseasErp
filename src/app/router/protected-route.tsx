import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "@/modules/auth/components/auth-provider";

export function ProtectedRoute() {
  const {
    session,
    profile,
    tenant,
    loading,
  } = useAuth();

  const location = useLocation();

  /*
   * Auth/profile/tenant information is still being resolved.
   *
   * IMPORTANT:
   * Do not redirect to /login while loading.
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  /*
   * No Supabase session.
   */
  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  /*
   * Session exists but profile could not be loaded.
   *
   * This is NOT a login problem.
   */
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Profile Not Found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Your account profile could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  /*
   * User active check.
   */
  if (!profile.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Account Inactive
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Your account is currently inactive.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Tenant check.
   */
  if (!tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Organization Not Found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Your account is not connected to an organization.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Tenant active check.
   */
  if (!tenant.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Organization Inactive
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Your organization is currently inactive.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Everything is valid.
   */
  return <Outlet />;
}