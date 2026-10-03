export type Role = "OWNER" | "ADMIN" | "MANAGER" | "STAFF"

export const PERMISSIONS = [
  "dashboard.view",
  "candidates.view",
  "candidates.create",
  "candidates.update",
  "candidates.delete",
  "agents.view",
  "agents.manage",
  "agencies.view",
  "agencies.manage",
  "processing.view", // medical, mofa, finger, police, takamul, visa, bmet, flight
  "processing.update",
  "accounts.view",
  "accounts.manage",
  "finance.view",
  "finance.manage",
  "reports.view",
  "reports.manage",
  "files.view",
  "files.manage",
  "tasks.manage",
  "trash.view",
  "trash.restore",
  "users.view",
  "users.manage",
  "data.export",
  "data.import",
  "audit.view",
  "settings.manage",
  "billing.manage",
] as const

export type Permission = (typeof PERMISSIONS)[number]

const STAFF: Permission[] = [
  "dashboard.view",
  "candidates.view",
  "candidates.create",
  "candidates.update",
  "agents.view",
  "agencies.view",
  "processing.view",
  "processing.update",
  "files.view",
  "files.manage",
  "tasks.manage",
]

const MANAGER: Permission[] = [
  ...STAFF,
  "candidates.delete",
  "agents.manage",
  "agencies.manage",
  "accounts.view",
  "finance.view",
  "reports.view",
  "reports.manage",
  "trash.view",
  "trash.restore",
  "data.export",
]

const ALL: Permission[] = [...PERMISSIONS]

export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  OWNER: new Set(ALL),
  ADMIN: new Set(ALL.filter((p) => p !== "billing.manage")),
  MANAGER: new Set(MANAGER),
  STAFF: new Set(STAFF),
}

/**
 * Route prefix -> required permission.
 * Longest matching prefix wins. Routes not listed here are open to everyone
 * (for example /app/todo and /app/settings).
 */
const ROUTE_PERMISSIONS: [prefix: string, permission: Permission][] = [
  ["/app/dashboard", "dashboard.view"],
  ["/app/candidates", "candidates.view"],
  ["/app/candidates/new", "candidates.create"],
  ["/app/agents", "agents.view"],
  ["/app/agencies", "agencies.view"],
  ["/app/medical", "processing.view"],
  ["/app/mofa", "processing.view"],
  ["/app/fingers", "processing.view"],
  ["/app/police-clearance", "processing.view"],
  ["/app/takamul", "processing.view"],
  ["/app/visa", "processing.view"],
  ["/app/bmet", "processing.view"],
  ["/app/flight", "processing.view"],
  ["/app/reports", "reports.view"],
  ["/app/accounts", "accounts.view"],
  ["/app/finance", "finance.view"],
  ["/app/files", "files.view"],
  ["/app/trash", "trash.view"],
]

export function normalizeRole(value: string | null | undefined): Role | null {
  const role = value?.toUpperCase()

  if (
    role === "OWNER" ||
    role === "ADMIN" ||
    role === "MANAGER" ||
    role === "STAFF"
  ) {
    return role
  }

  return null
}

export function roleCan(role: Role | null, permission: Permission): boolean {
  return role ? ROLE_PERMISSIONS[role].has(permission) : false
}

export function getRoutePermission(pathname: string): Permission | null {
  let best: [string, Permission] | null = null

  for (const entry of ROUTE_PERMISSIONS) {
    const prefix = entry[0]
    const matches = pathname === prefix || pathname.startsWith(`${prefix}/`)

    if (matches && (best === null || prefix.length > best[0].length)) {
      best = entry
    }
  }

  return best ? best[1] : null
}

export function roleCanAccessPath(role: Role | null, pathname: string): boolean {
  const required = getRoutePermission(pathname)
  return required === null ? true : roleCan(role, required)
}