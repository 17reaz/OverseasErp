import {
  useState,
} from "react";

import type {
  CreateTaskInput,
  TaskPriority,
  TaskModule,
} from "../task-types";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TaskFormProps = {
  onSubmit: (
    data: CreateTaskInput,
  ) => void;

  loading?: boolean;
};

const moduleOptions: {
  value: TaskModule;
  label: string;
}[] = [
  {
    value: "candidate",
    label: "Candidate",
  },
  {
    value: "medical",
    label: "Medical",
  },
  {
    value: "mofa",
    label: "MOFA",
  },
  {
    value: "finger",
    label: "Finger",
  },
  {
    value: "police_clearance",
    label: "Police Clearance",
  },
  {
    value: "takamul",
    label: "Takamul",
  },
  {
    value: "visa",
    label: "Visa",
  },
  {
    value: "bmet",
    label: "BMET",
  },
  {
    value: "flight",
    label: "Flight",
  },
  {
    value: "iqama",
    label: "Iqama",
  },
  {
    value: "general",
    label: "General",
  },
];

export function TaskForm({
  onSubmit,
}: TaskFormProps) {
  const [
    title,
    setTitle,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    priority,
    setPriority,
  ] =
    useState<TaskPriority>(
      "normal",
    );

  const [
    module,
    setModule,
  ] =
    useState<TaskModule | "">(
      "",
    );

  const [
    dueAt,
    setDueAt,
  ] = useState("");

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    onSubmit({
      title: title.trim(),

      description:
        description.trim() ||
        null,

      priority,

      module:
        module || null,

      due_at:
        dueAt
          ? new Date(
              dueAt,
            ).toISOString()
          : null,
    });
  }

  return (
    <form
      id="task-form"
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="task-title">
          Title
        </Label>

        <Input
          id="task-title"
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value,
            )
          }
          placeholder="e.g. Medical report check"
          autoFocus
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">
          Description
        </Label>

        <Textarea
          id="task-description"
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value,
            )
          }
          placeholder="Add details..."
          rows={4}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Priority
          </Label>

          <Select
            value={priority}
            onValueChange={(
              value,
            ) =>
              setPriority(
                value as TaskPriority,
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="low">
                Low
              </SelectItem>

              <SelectItem value="normal">
                Normal
              </SelectItem>

              <SelectItem value="high">
                High
              </SelectItem>

              <SelectItem value="urgent">
                Urgent
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            Module
          </Label>

          <Select
            value={module}
            onValueChange={(
              value,
            ) =>
              setModule(
                value as TaskModule,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select module" />
            </SelectTrigger>

            <SelectContent>
              {moduleOptions.map(
                (item) => (
                  <SelectItem
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {item.label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-due">
          Due date
        </Label>

        <Input
          id="task-due"
          type="datetime-local"
          value={dueAt}
          onChange={(event) =>
            setDueAt(
              event.target.value,
            )
          }
        />
      </div>
    </form>
  );
}