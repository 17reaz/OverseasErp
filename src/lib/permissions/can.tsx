import type { ReactNode } from "react"

import type { Permission } from "./permissions"
import { usePermissions } from "./use-permissions"

interface CanProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = usePermissions()
  return <>{can(permission) ? children : fallback}</>
}