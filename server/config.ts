const port = Number(process.env.PORT ?? 8000)

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("Invalid PORT configuration")
}

export const config = {
  port,

  supabase: {
    url: process.env.SUPABASE_URL ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  },
} as const