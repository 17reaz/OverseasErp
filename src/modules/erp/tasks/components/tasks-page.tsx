import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  ListTodo,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import type {
  CreateTaskInput,
  Task,
  TaskStatus,
} from "../task-types";

import {
  createTask,
  deleteTask,
  getTasks,
  updateTaskStatus,
} from "../task-service";

import {
  getTaskCounts,
} from "../task-utils";

import {
  TaskToolbar,
} from "./task-toolbar";

import {
  TasksTable,
} from "./tasks-table";

import {
  TaskForm,
} from "./task-form";

import {
  TaskDetailsSheet,
} from "./task-details-sheet";

import {
  UniversalSheet,
} from "@/modules/erp/shared/forms/universal-sheet";

type TaskFilter =
  | "all"
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue";

export function TasksPage() {
  const [
    tasks,
    setTasks,
  ] = useState<Task[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<TaskFilter>(
      "all",
    );

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    selectedTask,
    setSelectedTask,
  ] =
    useState<Task | null>(
      null,
    );

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  async function loadTasks() {
    try {
      setLoading(true);

      const data =
        await getTasks();

      setTasks(data);
    } catch (error) {
      console.error(
        "Failed to load tasks:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const counts =
    useMemo(
      () =>
        getTaskCounts(
          tasks,
        ),
      [tasks],
    );

  const filteredTasks =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return tasks.filter(
        (task) => {
          const matchesSearch =
            !query ||
            task.title
              .toLowerCase()
              .includes(query) ||
            task.description
              ?.toLowerCase()
              .includes(query) ||
            task.candidate?.name
              ?.toLowerCase()
              .includes(query) ||
            task.candidate?.passport_no
              ?.toLowerCase()
              .includes(query);

          if (
            !matchesSearch
          ) {
            return false;
          }

          if (
            filter ===
            "overdue"
          ) {
            if (
              !task.due_at ||
              task.status ===
                "completed" ||
              task.status ===
                "cancelled"
            ) {
              return false;
            }

            return (
              new Date(
                task.due_at,
              ).getTime() <
              Date.now()
            );
          }

          if (
            filter === "all"
          ) {
            return true;
          }

          return (
            task.status ===
            filter
          );
        },
      );
    }, [
      tasks,
      search,
      filter,
    ]);

  async function handleCreate(
    data: CreateTaskInput,
  ) {
    try {
      setCreating(true);

      await createTask(data);

      setCreateOpen(false);

      await loadTasks();
    } catch (error) {
      console.error(
        "Failed to create task:",
        error,
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleComplete(
    task: Task,
  ) {
    try {
      await updateTaskStatus(
        task.id,
        "completed",
      );

      await loadTasks();
    } catch (error) {
      console.error(
        "Failed to complete task:",
        error,
      );
    }
  }

  async function handleStatusChange(
    task: Task,
    status: TaskStatus,
  ) {
    try {
      await updateTaskStatus(
        task.id,
        status,
      );

      setSelectedTask(null);
      setDetailsOpen(false);

      await loadTasks();
    } catch (error) {
      console.error(
        "Failed to update task:",
        error,
      );
    }
  }

  async function handleDelete(
    task: Task,
  ) {
    try {
      await deleteTask(
        task.id,
      );

      setSelectedTask(null);
      setDetailsOpen(false);

      await loadTasks();
    } catch (error) {
      console.error(
        "Failed to delete task:",
        error,
      );
    }
  }

  function handleSelectTask(
    task: Task,
  ) {
    setSelectedTask(task);
    setDetailsOpen(true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="border-b px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />

              <h1 className="text-lg font-semibold">
                Tasks
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage your work and follow-ups.
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          KPI
      ================================================= */}

      <div className="grid gap-3 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Pending
              </p>

              <p className="mt-1 text-xl font-semibold">
                {counts.pending}
              </p>
            </div>

            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">
                In Progress
              </p>

              <p className="mt-1 text-xl font-semibold">
                {counts.inProgress}
              </p>
            </div>

            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Overdue
              </p>

              <p className="mt-1 text-xl font-semibold">
                {counts.overdue}
              </p>
            </div>

            <CircleAlert className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Completed
              </p>

              <p className="mt-1 text-xl font-semibold">
                {counts.completed}
              </p>
            </div>

            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <TaskToolbar
        search={search}
        onSearchChange={
          setSearch
        }
        onRefresh={
          () => void loadTasks()
        }
        onCreate={() =>
          setCreateOpen(true)
        }
        loading={loading}
      />

      {/* =================================================
          FILTER
      ================================================= */}

      <div className="px-6 py-3">
        <Tabs
          value={filter}
          onValueChange={(
            value,
          ) =>
            setFilter(
              value as TaskFilter,
            )
          }
        >
          <TabsList>
            <TabsTrigger value="all">
              All
            </TabsTrigger>

            <TabsTrigger value="pending">
              Pending
            </TabsTrigger>

            <TabsTrigger value="in_progress">
              In Progress
            </TabsTrigger>

            <TabsTrigger value="overdue">
              Overdue
            </TabsTrigger>

            <TabsTrigger value="completed">
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="min-h-0 flex-1 overflow-auto">
        <TasksTable
          tasks={
            filteredTasks
          }
          onSelect={
            handleSelectTask
          }
          onComplete={
            handleComplete
          }
        />
      </div>

      {/* =================================================
          CREATE SHEET
      ================================================= */}

      <UniversalSheet
        open={createOpen}
        onOpenChange={
          setCreateOpen
        }
        title="Create task"
        description="Add a new task to your workspace."
        onSubmit={(
          event,
        ) => {
          event.preventDefault();

          const form =
            event.currentTarget;

          form.requestSubmit();
        }}
        footer={
          <div className="flex w-full justify-end gap-2">
            <button
              type="button"
              className="hidden"
              onClick={() =>
                setCreateOpen(
                  false,
                )
              }
            />

            <button
              type="submit"
              form="task-form"
              disabled={creating}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              {creating
                ? "Creating..."
                : "Create task"}
            </button>
          </div>
        }
      >
        <TaskForm
          onSubmit={
            handleCreate
          }
          loading={
            creating
          }
        />
      </UniversalSheet>

      {/* =================================================
          DETAILS
      ================================================= */}

      <TaskDetailsSheet
        task={
          selectedTask
        }
        open={
          detailsOpen
        }
        onOpenChange={
          setDetailsOpen
        }
        onStatusChange={
          handleStatusChange
        }
        onDelete={
          handleDelete
        }
        loading={
          loading
        }
      />
    </div>
  );
}