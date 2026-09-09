import {
  CircleCheck,
  CircleDot,
  CircleX,
  LoaderCircle,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import type {
  TaskStatus,
} from "../task-types";

import {
  getTaskStatusLabel,
} from "../task-utils";

type TaskStatusBadgeProps = {
  status: TaskStatus;
};

export function TaskStatusBadge({
  status,
}: TaskStatusBadgeProps) {
  const iconClass =
    "h-3.5 w-3.5";

  if (
    status === "completed"
  ) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5"
      >
        <CircleCheck
          className={iconClass}
        />
        {getTaskStatusLabel(
          status,
        )}
      </Badge>
    );
  }

  if (
    status === "in_progress"
  ) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5"
      >
        <LoaderCircle
          className={iconClass}
        />
        {getTaskStatusLabel(
          status,
        )}
      </Badge>
    );
  }

  if (
    status === "cancelled"
  ) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5"
      >
        <CircleX
          className={iconClass}
        />
        {getTaskStatusLabel(
          status,
        )}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1.5"
    >
      <CircleDot
        className={iconClass}
      />
      {getTaskStatusLabel(
        status,
      )}
    </Badge>
  );
}