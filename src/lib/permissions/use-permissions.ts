import { useCallback, useMemo } from "react"

import { useAuth } from "@/modules/auth/components/auth-provider"

import {
  normalizeRole,
  roleCan,
  roleCanAccessPath,
  type Permission,
} from "./permissions"

export function usePermissions() {
  const { profile } = useAuth()
  const role = normalizeRole(profile?.role)

  const can = useCallback(
    (permission: Permission) => roleCan(role, permission),
    [role],
  )

  const canAccessPath = useCallback(
    (pathname: string) => roleCanAccessPath(role, pathname),
    [role],
  )

  return useMemo(
    () => ({ role, can, canAccessPath }),
    [role, can, canAccessPath],
  )
}