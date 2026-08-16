import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/modules/auth/components/auth-provider";

export function ProtectedRoute() {
  const {
    session,
    profile,
    tenant,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  // 1. Authentication check
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 2. Profile check
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // 3. User active check
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

  // 4. Tenant check
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

  // 5. Tenant active check
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

  // Everything is valid
  return <Outlet />;
}