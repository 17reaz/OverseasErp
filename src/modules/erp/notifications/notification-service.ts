import { supabase } from "@/lib/supabase/client";

import type {
  SystemNotification,
  SystemNotificationType,
} from "./notification-types";

const UPDATE_EVENT = "overseas-erp:notifications-updated";

function emitUpdate() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(UPDATE_EVENT),
  );
}

function mapNotification(row: {
  id: string;
  type: SystemNotificationType;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
}): SystemNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
    read: row.read_at !== null,
    actionUrl: row.action_url,
    metadata: row.metadata ?? {},
  };
}


/* -------------------------------------------------- */
/* Current authenticated user                         */
/* -------------------------------------------------- */

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}


/* -------------------------------------------------- */
/* Get notifications                                  */
/* -------------------------------------------------- */

export async function getSystemNotifications(
  userId?: string | null,
): Promise<SystemNotification[]> {
  const resolvedUserId =
    userId ?? (await getCurrentUserId());

  if (!resolvedUserId) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
        id,
        type,
        title,
        message,
        created_at,
        read_at,
        action_url,
        metadata
      `,
    )
    .eq("user_id", resolvedUserId)
    .order("created_at", {
      ascending: false,
    })
    .limit(100);

  if (error) {
    console.error(
      "[Notifications] Failed to load notifications:",
      error,
    );

    return [];
  }

  return (data ?? []).map(mapNotification);
}


/* -------------------------------------------------- */
/* Unread count                                       */
/* -------------------------------------------------- */

export async function getUnreadSystemNotificationCount(
  userId?: string | null,
): Promise<number> {
  const resolvedUserId =
    userId ?? (await getCurrentUserId());

  if (!resolvedUserId) {
    return 0;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", resolvedUserId)
    .is("read_at", null);

  if (error) {
    console.error(
      "[Notifications] Failed to load unread count:",
      error,
    );

    return 0;
  }

  return count ?? 0;
}


/* -------------------------------------------------- */
/* Mark one as read                                   */
/* -------------------------------------------------- */

export async function markSystemNotificationRead(
  id: string,
  userId?: string | null,
): Promise<void> {
  const resolvedUserId =
    userId ?? (await getCurrentUserId());

  if (!resolvedUserId) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", resolvedUserId);

  if (error) {
    console.error(
      "[Notifications] Failed to mark notification read:",
      error,
    );

    return;
  }

  emitUpdate();
}


/* -------------------------------------------------- */
/* Mark all as read                                   */
/* -------------------------------------------------- */

export async function markAllSystemNotificationsRead(
  userId?: string | null,
): Promise<void> {
  const resolvedUserId =
    userId ?? (await getCurrentUserId());

  if (!resolvedUserId) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("user_id", resolvedUserId)
    .is("read_at", null);

  if (error) {
    console.error(
      "[Notifications] Failed to mark all read:",
      error,
    );

    return;
  }

  emitUpdate();
}


/* -------------------------------------------------- */
/* Create notification                                */
/* -------------------------------------------------- */

export async function createSystemNotification(
  input: {
    title: string;
    message: string;
    type?: SystemNotificationType;
    actionUrl?: string | null;
    metadata?: Record<string, unknown>;
  },
  userId?: string | null,
): Promise<SystemNotification | null> {
  const resolvedUserId =
    userId ?? (await getCurrentUserId());

  if (!resolvedUserId) {
    return null;
  }

  const {
    data: tenantId,
    error: tenantError,
  } = await supabase.rpc(
    "get_my_tenant_id",
  );

  if (tenantError || !tenantId) {
    console.error(
      "[Notifications] Failed to resolve tenant:",
      tenantError,
    );

    return null;
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      tenant_id: tenantId,
      user_id: resolvedUserId,

      type:
        input.type ?? "info",

      title:
        input.title,

      message:
        input.message,

      action_url:
        input.actionUrl ?? null,

      metadata:
        input.metadata ?? {},
    })
    .select(
      `
        id,
        type,
        title,
        message,
        created_at,
        read_at,
        action_url,
        metadata
      `,
    )
    .single();

  if (error || !data) {
    console.error(
      "[Notifications] Failed to create notification:",
      error,
    );

    return null;
  }

  emitUpdate();

  return mapNotification(data);
}


/* -------------------------------------------------- */
/* Realtime subscription                              */
/* -------------------------------------------------- */

export function subscribeToSystemNotifications(
  userId: string | null | undefined,
  listener: () => void,
): () => void {
  if (!userId) {
    return () => undefined;
  }

  const handleCustomEvent = () => {
    listener();
  };

  window.addEventListener(
    UPDATE_EVENT,
    handleCustomEvent,
  );

  const channel = supabase
    .channel(
      `notifications:${userId}`,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        listener();
      },
    )
    .subscribe();

  return () => {
    window.removeEventListener(
      UPDATE_EVENT,
      handleCustomEvent,
    );

    void supabase.removeChannel(
      channel,
    );
  };
}