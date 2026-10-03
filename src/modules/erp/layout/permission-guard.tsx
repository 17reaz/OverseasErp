import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { usePermissions } from "@/lib/permissions/use-permissions"

export function PermissionGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { canAccessPath } = usePermissions()

  if (canAccessPath(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border bg-muted">
        <ShieldAlert className="size-5 text-muted-foreground" />
      </div>

      <h2 className="text-lg font-semibold">Access restricted</h2>

      <p className="max-w-sm text-sm text-muted-foreground">
        Your role does not have permission to view this page. Please contact
        your administrator if you need access.
      </p>

      <Button asChild variant="outline" size="sm">
        <Link to="/app/todo">Go to Todo</Link>
      </Button>
    </div>
  )
}