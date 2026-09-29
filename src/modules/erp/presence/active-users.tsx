import { useEffect, useState } from "react"
import {
  Check,
  CircleUserRound,
  Users,
} from "lucide-react"

import {
  getActiveUsers,
  type ActiveUser,
} from "./active-users-service"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Button } from "@/components/ui/button"

function getInitials(user: ActiveUser) {
  return user.initials || user.name.charAt(0)
}

function formatLastSeen(
  date: string,
) {
  const diff =
    Date.now() -
    new Date(date).getTime()

  const minutes = Math.floor(
    diff / 60000,
  )

  if (minutes <= 0) {
    return "Just now"
  }

  if (minutes === 1) {
    return "1 min ago"
  }

  return `${minutes} min ago`
}

export function ActiveUsers() {
  const [users, setUsers] =
    useState<ActiveUser[]>([])

  useEffect(() => {
    void getActiveUsers().then(
      setUsers,
    )
  }, [])

  const visibleUsers = users.slice(0, 2)
  const extraCount = Math.max(
    users.length - 2,
    0,
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label="Active users"
        >
          <div className="flex -space-x-2">
            {visibleUsers.map(
              (user) => (
                <Avatar
                  key={user.id}
                  className="size-6 border-2 border-background"
                >
                  {user.avatarUrl && (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.name}
                    />
                  )}

                  <AvatarFallback className="text-[10px]">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
              ),
            )}

            {extraCount > 0 && (
              <div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                +{extraCount}
              </div>
            )}
          </div>

          {users.length > 0 && (
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-2"
      >
        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <Users className="size-4" />

            <div>
              <p className="text-sm font-medium">
                Active users
              </p>

              <p className="text-xs text-muted-foreground">
                {users.length} currently active
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
            >
              <div className="relative">
                <Avatar className="size-8">
                  {user.avatarUrl && (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.name}
                    />
                  )}

                  <AvatarFallback>
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>

                <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-medium">
                    {user.name}
                  </p>

                  {user.isCurrentUser && (
                    <Check className="size-3 text-emerald-500" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {user.role} ·{" "}
                  {formatLastSeen(
                    user.lastSeenAt,
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}