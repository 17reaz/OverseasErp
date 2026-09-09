import { supabase } from "@/lib/supabase/client";

import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "./task-types";

/* =========================================================
   GET CURRENT USER
========================================================= */

async function getCurrentUserId() {
  const {
    data: {
      user,
    },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return user.id;
}

/* =========================================================
   GET TASKS
========================================================= */

export async function getTasks(): Promise<Task[]> {
  const {
    data,
    error,
  } = await supabase
    .from("tasks")
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        passport_no
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "getTasks error:",
      error,
    );

    throw error;
  }

  return (data ?? []) as Task[];
}

/* =========================================================
   GET SINGLE TASK
========================================================= */

export async function getTask(
  id: string,
): Promise<Task | null> {
  const {
    data,
    error,
  } = await supabase
    .from("tasks")
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        passport_no
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Task | null;
}

/* =========================================================
   CREATE TASK
========================================================= */

export async function createTask(
  input: CreateTaskInput,
): Promise<Task> {
  const userId =
    await getCurrentUserId();

  const {
    data: tenantId,
    error: tenantError,
  } = await supabase.rpc(
    "get_my_tenant_id",
  );

  if (tenantError) {
    throw tenantError;
  }

  if (!tenantId) {
    throw new Error(
      "Unable to determine tenant.",
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("tasks")
    .insert({
      tenant_id: tenantId,

      title: input.title.trim(),

      description:
        input.description?.trim() ||
        null,

      status:
        input.status ??
        "pending",

      priority:
        input.priority ??
        "normal",

      assigned_to:
        input.assigned_to ??
        userId,

      created_by: userId,

      candidate_id:
        input.candidate_id ??
        null,

      module:
        input.module ??
        null,

      reference_id:
        input.reference_id ??
        null,

      due_at:
        input.due_at ??
        null,
    })
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        passport_no
      )
    `)
    .single();

  if (error) {
    console.error(
      "createTask error:",
      error,
    );

    throw error;
  }

  return data as Task;
}

/* =========================================================
   UPDATE TASK
========================================================= */

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const payload: Record<
    string,
    unknown
  > = {
    ...input,
  };

  if (
    input.title !== undefined
  ) {
    payload.title =
      input.title.trim();
  }

  if (
    input.description !== undefined
  ) {
    payload.description =
      input.description?.trim() ||
      null;
  }

  if (
    input.status === "completed"
  ) {
    payload.completed_at =
      input.completed_at ??
      new Date().toISOString();
  }

  if (
    input.status &&
    input.status !== "completed"
  ) {
    payload.completed_at = null;
  }

  const {
    data,
    error,
  } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", id)
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        passport_no
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return data as Task;
}

/* =========================================================
   UPDATE STATUS
========================================================= */

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<Task> {
  return updateTask(
    id,
    {
      status,
    },
  );
}

/* =========================================================
   DELETE TASK
========================================================= */

export async function deleteTask(
  id: string,
): Promise<void> {
  const {
    error,
  } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}