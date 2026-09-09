import {
  CalendarClock,
  Check,
  CircleAlert,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  cn,
} from "@/lib/utils";

import type {
  Task,
} from "../task-types";

import {
  formatTaskDueDate,
  getTaskModuleLabel,
  getTaskPriorityLabel,
  isTaskOverdue,
} from "../task-utils";

import {
  TaskStatusBadge,
} from "./task-status-badge";

type TasksTableProps = {
  tasks: Task[];

  onSelect: (
    task: Task,
  ) => void;

  onComplete: (
    task: Task,
  ) => void;
};

export function TasksTable({
  tasks,
  onSelect,
  onComplete,
}: TasksTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm font-medium">
            No tasks found
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Create a task to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {tasks.map(
        (task) => {
          const overdue =
            isTaskOverdue(task);

          return (
            <div
              key={task.id}
              className={cn(
                "group flex items-start gap-3 px-6 py-4 transition-colors hover:bg-muted/30",
                overdue &&
                  "bg-destructive/[0.03]",
              )}
            >
              <button
                type="button"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-muted"
                onClick={() =>
                  onComplete(task)
                }
                disabled={
                  task.status ===
                    "completed" ||
                  task.status ===
                    "cancelled"
                }
                aria-label="Complete task"
              >
                {task.status ===
                  "completed" && (
                  <Check className="h-3 w-3" />
                )}
              </button>

              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  onSelect(task)
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      task.status ===
                        "completed" &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {task.title}
                  </span>

                  {overdue && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                      <CircleAlert className="h-3 w-3" />
                      Overdue
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {task.description}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {task.candidate && (
                    <span>
                      {task.candidate.name}
                    </span>
                  )}

                  {task.candidate
                    ?.passport_no && (
                    <span>
                      {
                        task
                          .candidate
                          .passport_no
                      }
                    </span>
                  )}

                  {task.module && (
                    <span>
                      {getTaskModuleLabel(
                        task.module,
                      )}
                    </span>
                  )}

                  <span>
                    {getTaskPriorityLabel(
                      task.priority,
                    )}
                  </span>

                  {task.due_at && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        overdue &&
                          "font-medium text-destructive",
                      )}
                    >
                      <CalendarClock className="h-3 w-3" />
                      {formatTaskDueDate(
                        task.due_at,
                      )}
                    </span>
                  )}
                </div>
              </button>

              <div className="hidden shrink-0 sm:block">
                <TaskStatusBadge
                  status={
                    task.status
                  }
                />
              </div>

              {task.status !==
                "completed" &&
                task.status !==
                  "cancelled" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden shrink-0 sm:inline-flex"
                    onClick={() =>
                      onComplete(task)
                    }
                    title="Complete"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
            </div>
          );
        },
      )}
    </div>
  );
}