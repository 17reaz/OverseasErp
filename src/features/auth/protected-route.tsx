import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from './auth-provider'
import { useProfile } from './profile-context'

export function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const location = useLocation()

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold">
            Profile not found
          </h1>

          <p className="text-sm text-muted-foreground">
            Your account profile could not be loaded.
          </p>
        </div>
      </div>
    )
  }

  if (!profile.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold">
            Account inactive
          </h1>

          <p className="text-sm text-muted-foreground">
            Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  return <Outlet />
}