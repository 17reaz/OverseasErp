import { describe, expect, test } from "bun:test"

import {
  getRoutePermission,
  normalizeRole,
  roleCan,
  roleCanAccessPath,
} from "../src/lib/permissions/permissions"

describe("permissions", () => {
  test("staff cannot delete candidates or open accounts", () => {
    expect(roleCan("STAFF", "candidates.update")).toBe(true)
    expect(roleCan("STAFF", "candidates.delete")).toBe(false)
    expect(roleCanAccessPath("STAFF", "/app/accounts/sales")).toBe(false)
  })

  test("manager can delete candidates but cannot manage users", () => {
    expect(roleCan("MANAGER", "candidates.delete")).toBe(true)
    expect(roleCan("MANAGER", "users.manage")).toBe(false)
  })

  test("only owner and admin can view audit log", () => {
    expect(roleCan("OWNER", "audit.view")).toBe(true)
    expect(roleCan("ADMIN", "audit.view")).toBe(true)
    expect(roleCan("MANAGER", "audit.view")).toBe(false)
  })

  test("admin cannot manage billing, owner can", () => {
    expect(roleCan("ADMIN", "billing.manage")).toBe(false)
    expect(roleCan("OWNER", "billing.manage")).toBe(true)
  })

  test("longest route prefix wins", () => {
    expect(getRoutePermission("/app/candidates/new")).toBe("candidates.create")
    expect(getRoutePermission("/app/candidates/123")).toBe("candidates.view")
    expect(getRoutePermission("/app/todo")).toBeNull()
  })

  test("unknown role is denied", () => {
    expect(normalizeRole("guest")).toBeNull()
    expect(roleCan(normalizeRole("guest"), "dashboard.view")).toBe(false)
  })
})