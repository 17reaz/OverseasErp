export interface ActiveUser {
  id: string
  name: string
  role: string
  initials: string
  avatarUrl: string | null
  lastSeenAt: string
  isCurrentUser: boolean
}

const DUMMY_ACTIVE_USERS: ActiveUser[] = [
  {
    id: "user-1",
    name: "Reaz",
    role: "Owner",
    initials: "R",
    avatarUrl: null,
    lastSeenAt: new Date().toISOString(),
    isCurrentUser: true,
  },
  {
    id: "user-2",
    name: "Arif",
    role: "Manager",
    initials: "A",
    avatarUrl: null,
    lastSeenAt: new Date(
      Date.now() - 3 * 60 * 1000,
    ).toISOString(),
    isCurrentUser: false,
  },
  {
    id: "user-3",
    name: "Hasan",
    role: "Staff",
    initials: "H",
    avatarUrl: null,
    lastSeenAt: new Date(
      Date.now() - 7 * 60 * 1000,
    ).toISOString(),
    isCurrentUser: false,
  },
  {
    id: "user-4",
    name: "Nayeem",
    role: "Staff",
    initials: "N",
    avatarUrl: null,
    lastSeenAt: new Date(
      Date.now() - 11 * 60 * 1000,
    ).toISOString(),
    isCurrentUser: false,
  },
  {
    id: "user-5",
    name: "Sabbir",
    role: "Manager",
    initials: "S",
    avatarUrl: null,
    lastSeenAt: new Date(
      Date.now() - 18 * 60 * 1000,
    ).toISOString(),
    isCurrentUser: false,
  },
]

export async function getActiveUsers(): Promise<
  ActiveUser[]
> {
  return DUMMY_ACTIVE_USERS
}