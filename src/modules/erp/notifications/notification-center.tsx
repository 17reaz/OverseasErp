import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  CheckCheck,
  Info,
  TriangleAlert,
  CircleCheck,
  CircleX,
  Bell,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  ScrollArea,
} from "@/components/ui/scroll-area";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  cn,
} from "@/lib/utils";

import type {
  SystemNotification,
} from "./notification-types";

import {
  getSystemNotifications,
  markAllSystemNotificationsRead,
  markSystemNotificationRead,
  subscribeToSystemNotifications,
} from "./notification-service";

type NotificationCenterProps = {
  open: boolean;
  onOpenChange: (
    open: boolean,
  ) => void;
  userId?: string | null;
};

function NotificationIcon({
  type,
}: {
  type: SystemNotification["type"];
}) {
  if (type === "success") {
    return (
      <CircleCheck className="h-4 w-4" />
    );
  }

  if (type === "warning") {
    return (
      <TriangleAlert className="h-4 w-4" />
    );
  }

  if (type === "error") {
    return (
      <CircleX className="h-4 w-4" />
    );
  }

  return (
    <Info className="h-4 w-4" />
  );
}

function formatNotificationTime(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

export function NotificationCenter({
  open,
  onOpenChange,
  userId,
}: NotificationCenterProps) {
  const [
    notifications,
    setNotifications,
  ] = useState<SystemNotification[]>(
    [],
  );

  const loadNotifications = async () => {
  const data = await getSystemNotifications(userId);
  setNotifications(data);
};

useEffect(() => {
  if (!userId) {
    setNotifications([]);
    return;
  }

  let mounted = true;

  const load = async () => {
    const data = await getSystemNotifications(userId);

    if (mounted) {
      setNotifications(data);
    }
  };

  void load();

  const unsubscribe =
    subscribeToSystemNotifications(
      userId,
      () => {
        void load();
      },
    );

  return () => {
    mounted = false;
    unsubscribe();
  };
}, [userId]);

const handleRead = async (id: string) => {
  await markSystemNotificationRead(
    id,
    userId,
  );

  await loadNotifications();
};

const handleReadAll = async () => {
  await markAllSystemNotificationsRead(
    userId,
  );

  await loadNotifications();
};

const unreadCount = notifications.filter(
  (notification) => !notification.read,
).length;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </SheetTitle>

              <SheetDescription>
                System messages and updates.
              </SheetDescription>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={handleReadAll}
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-muted/40">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>

              <p className="text-sm font-medium">
                No notifications
              </p>

              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                System messages will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(
                (notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "relative px-5 py-4 transition-colors",
                      !notification.read &&
                        "bg-muted/30",
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                          notification.type ===
                            "error" &&
                            "text-destructive",
                          notification.type ===
                            "warning" &&
                            "text-amber-600",
                          notification.type ===
                            "success" &&
                            "text-emerald-600",
                        )}
                      >
                        <NotificationIcon
                          type={
                            notification.type
                          }
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>

                          {!notification.read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {notification.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-[11px] text-muted-foreground">
                            {formatNotificationTime(
                              notification.createdAt,
                            )}
                          </span>

                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 px-2 text-xs"
                              onClick={() =>
                                handleRead(
                                  notification.id,
                                )
                              }
                            >
                              <Check className="h-3.5 w-3.5" />
                              Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}