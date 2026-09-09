import type {
  Task,
  TaskPriority,
  TaskStatus,
} from "./task-types";

/* =========================================================
   STATUS
========================================================= */

export function getTaskStatusLabel(
  status: TaskStatus,
): string {
  switch (status) {
    case "pending":
      return "Pending";

    case "in_progress":
      return "In Progress";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

/* =========================================================
   PRIORITY
========================================================= */

export function getTaskPriorityLabel(
  priority: TaskPriority,
): string {
  switch (priority) {
    case "low":
      return "Low";

    case "normal":
      return "Normal";

    case "high":
      return "High";

    case "urgent":
      return "Urgent";

    default:
      return priority;
  }
}

/* =========================================================
   MODULE
========================================================= */

export function getTaskModuleLabel(
  module: Task["module"],
): string {
  if (!module) {
    return "General";
  }

  switch (module) {
    case "candidate":
      return "Candidate";

    case "medical":
      return "Medical";

    case "mofa":
      return "MOFA";

    case "finger":
      return "Finger";

    case "police_clearance":
      return "Police Clearance";

    case "takamul":
      return "Takamul";

    case "visa":
      return "Visa";

    case "bmet":
      return "BMET";

    case "flight":
      return "Flight";

    case "iqama":
      return "Iqama";

    case "general":
      return "General";

    default:
      return module;
  }
}

/* =========================================================
   DUE DATE
========================================================= */

export function isTaskOverdue(
  task: Task,
): boolean {
  if (!task.due_at) {
    return false;
  }

  if (
    task.status === "completed" ||
    task.status === "cancelled"
  ) {
    return false;
  }

  return (
    new Date(task.due_at).getTime() <
    Date.now()
  );
}

export function formatTaskDueDate(
  value: string | null,
): string {
  if (!value) {
    return "No due date";
  }

  const date = new Date(value);

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

/* =========================================================
   COUNTS
========================================================= */

export function getTaskCounts(
  tasks: Task[],
) {
  const pending = tasks.filter(
    (task) =>
      task.status === "pending",
  ).length;

  const inProgress = tasks.filter(
    (task) =>
      task.status === "in_progress",
  ).length;

  const completed = tasks.filter(
    (task) =>
      task.status === "completed",
  ).length;

  const cancelled = tasks.filter(
    (task) =>
      task.status === "cancelled",
  ).length;

  const overdue = tasks.filter(
    isTaskOverdue,
  ).length;

  return {
    pending,
    inProgress,
    completed,
    cancelled,
    overdue,
    total: tasks.length,
  };
}