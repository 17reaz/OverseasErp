import {
  useState,
} from "react";

import {
  CalendarClock,
  Check,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Separator,
} from "@/components/ui/separator";

import {
  UniversalSheet,
} from "@/modules/erp/shared/forms/universal-sheet";

import type {
  Task,
  TaskStatus,
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

type TaskDetailsSheetProps = {
  task: Task | null;

  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;

  onStatusChange: (
    task: Task,
    status: TaskStatus,
  ) => void;

  onDelete: (
    task: Task,
  ) => void;

  loading?: boolean;
};

export function TaskDetailsSheet({
  task,
  open,
  onOpenChange,
  onStatusChange,
  onDelete,
  loading = false,
}: TaskDetailsSheetProps) {
  const [
    hasChanges,
  ] = useState(false);

  if (!task) {
    return null;
  }

  const overdue =
    isTaskOverdue(task);

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={task.title}
      description={
        task.candidate
          ? `${task.candidate.name} • ${task.candidate.passport_no}`
          : "Task details"
      }
      hasChanges={hasChanges}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() =>
              onDelete(task)
            }
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          <div className="flex items-center gap-2">
            {task.status !==
              "completed" &&
              task.status !==
                "cancelled" && (
                <Button
                  type="button"
                  onClick={() =>
                    onStatusChange(
                      task,
                      "completed",
                    )
                  }
                  disabled={loading}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Complete
                </Button>
              )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusBadge
            status={task.status}
          />

          <span className="rounded-md border px-2 py-1 text-xs">
            {getTaskPriorityLabel(
              task.priority,
            )}
          </span>

          {task.module && (
            <span className="rounded-md border px-2 py-1 text-xs">
              {getTaskModuleLabel(
                task.module,
              )}
            </span>
          )}
        </div>

        {task.description && (
          <div>
            <p className="text-sm leading-6">
              {task.description}
            </p>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">
                Due date
              </p>

              <p
                className={
                  overdue
                    ? "mt-1 text-sm font-medium text-destructive"
                    : "mt-1 text-sm"
                }
              >
                {formatTaskDueDate(
                  task.due_at,
                )}
              </p>
            </div>
          </div>
        </div>

        {task.candidate && (
          <>
            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">
                Candidate
              </p>

              <p className="mt-1 text-sm font-medium">
                {task.candidate.name}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {task.candidate.passport_no}
              </p>
            </div>
          </>
        )}
      </div>
    </UniversalSheet>
  );
}