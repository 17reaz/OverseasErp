import type {
  SystemNotification,
  SystemNotificationType,
} from "./notification-types";

const STORAGE_PREFIX =
  "overseas-erp:system-notifications";

const UPDATE_EVENT =
  "overseas-erp:notifications-updated";

function getStorageKey(
  userId?: string | null,
): string {
  return `${STORAGE_PREFIX}:${userId ?? "default"}`;
}

function emitUpdate(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(UPDATE_EVENT),
  );
}

export function getSystemNotifications(
  userId?: string | null,
): SystemNotification[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        getStorageKey(userId),
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as SystemNotification[];
  } catch (error) {
    console.error(
      "[Notifications] Failed to read notifications:",
      error,
    );

    return [];
  }
}

function saveNotifications(
  notifications: SystemNotification[],
  userId?: string | null,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(notifications),
  );

  emitUpdate();
}

export function getUnreadSystemNotificationCount(
  userId?: string | null,
): number {
  return getSystemNotifications(
    userId,
  ).filter(
    (notification) =>
      !notification.read,
  ).length;
}

export function markSystemNotificationRead(
  id: string,
  userId?: string | null,
): void {
  const notifications =
    getSystemNotifications(userId);

  const updated =
    notifications.map(
      (notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification,
    );

  saveNotifications(
    updated,
    userId,
  );
}

export function markAllSystemNotificationsRead(
  userId?: string | null,
): void {
  const notifications =
    getSystemNotifications(userId);

  if (notifications.length === 0) {
    return;
  }

  const updated =
    notifications.map(
      (notification) => ({
        ...notification,
        read: true,
      }),
    );

  saveNotifications(
    updated,
    userId,
  );
}

export function createSystemNotification(
  input: {
    title: string;
    message: string;
    type?: SystemNotificationType;
  },
  userId?: string | null,
): SystemNotification {
  const notification: SystemNotification = {
    id: crypto.randomUUID(),

    type:
      input.type ?? "info",

    title: input.title,

    message: input.message,

    createdAt:
      new Date().toISOString(),

    read: false,
  };

  const existing =
    getSystemNotifications(userId);

  saveNotifications(
    [
      notification,
      ...existing,
    ].slice(0, 100),
    userId,
  );

  return notification;
}

export function subscribeToSystemNotifications(
  listener: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleCustomEvent = () => {
    listener();
  };

  const handleStorage = (
    event: StorageEvent,
  ) => {
    if (
      event.key?.startsWith(
        STORAGE_PREFIX,
      )
    ) {
      listener();
    }
  };

  window.addEventListener(
    UPDATE_EVENT,
    handleCustomEvent,
  );

  window.addEventListener(
    "storage",
    handleStorage,
  );

  return () => {
    window.removeEventListener(
      UPDATE_EVENT,
      handleCustomEvent,
    );

    window.removeEventListener(
      "storage",
      handleStorage,
    );
  };
}