/* =========================================================
   TEMPLATE PERMISSIONS
   ---------------------------------------------------------
   The project does not currently have a dedicated role/
   permission module — `profiles.role` (see auth-provider.tsx)
   is the only signal available today. This file adapts to
   that instead of introducing a second permission system.

   OWNER / ADMIN → create, edit, lock/unlock, deactivate
   Everyone else → use active locked templates only

   If/when the project adds a real permission system, only
   this file needs to change.
========================================================= */

const TEMPLATE_MANAGER_ROLES = ["owner", "admin"]

export function canManageTemplates(
  role: string | null | undefined,
): boolean {
  if (!role) {
    return false
  }

  return TEMPLATE_MANAGER_ROLES.includes(role.trim().toLowerCase())
}
