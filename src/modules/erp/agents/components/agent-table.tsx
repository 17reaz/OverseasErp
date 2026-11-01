
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MoreHorizontal,
  Trash2,
  UserRound,
  Phone,
  CalendarDays,
  Hash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { Agent } from "../types";
import type { AgentViewMode } from "./agents-toolbar";

import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";

interface AgentTableProps {
  agents: Agent[];
  loading?: boolean;
  viewMode?: AgentViewMode;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onDelete: (id: string) => void;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AgentActions({
  agent,
  onDelete,
}: {
  agent: Agent;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="More actions"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="w-64 rounded-xl p-4"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>

            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold">Delete agent?</p>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">
                  {agent.name ?? "this agent"}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(agent.id);
                setOpen(false);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AgentStatus({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex h-5 items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
      Active
    </span>
  ) : (
    <span className="inline-flex h-5 items-center rounded-full border border-muted-foreground/30 bg-muted px-2 text-[11px] font-medium text-muted-foreground">
      Inactive
    </span>
  );
}

function AgentGrid({
  agents,
  onDelete,
}: {
  agents: Agent[];
  onDelete: (id: string) => void;
}) {
  if (agents.length === 0) {
    return (
      <div className="flex min-h-[250px] flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium">No agents found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add an agent to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="min-w-0 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  to={`/app/agents/${agent.id}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {agent.name ?? "Unnamed Agent"}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  #{agent.sl ?? "—"}
                </p>
              </div>

              <AgentActions agent={agent} onDelete={onDelete} />
            </div>

            <dl className="mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Code</dt>
                <dd className="truncate font-mono">{agent.code ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="truncate">{agent.phone ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatDate(agent.created_at)}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <AgentStatus active={Boolean(agent.is_active)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABLE_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background";

export function AgentTable({
  agents,
  loading = false,
  viewMode = "list",

  page,
  pageSize = 10,
  total,
  onPageChange,

  onDelete,
}: AgentTableProps) {
  const columns: DataTableColumn<Agent>[] = [
    {
      key: "sl",
      header: "SL",
      className: "w-[80px] font-medium",
      cell: (agent) => agent.sl ?? "—",
    },
    {
      key: "code",
      header: "Code",
      cell: (agent) => agent.code ?? "—",
    },
    {
      key: "name",
      header: "Name",
      cell: (agent) => (
        <Link
          to={`/app/agents/${agent.id}`}
          className="font-medium hover:underline"
        >
          {agent.name ?? "—"}
        </Link>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (agent) => agent.phone ?? "—",
    },
    {
      key: "status",
      header: "Status",
      className: "w-[110px]",
      cell: (agent) => <AgentStatus active={Boolean(agent.is_active)} />,
    },
    {
      key: "created_at",
      header: "Created",
      className: "w-[130px]",
      cell: (agent) => formatDate(agent.created_at),
    },
    {
      key: "updated_at",
      header: "Updated",
      className: "w-[130px]",
      cell: (agent) => formatDate(agent.updated_at),
    },
    {
      key: "action",
      header: "Actions",
      className: "w-[80px] text-right",
      cell: (agent) => (
        <AgentActions agent={agent} onDelete={onDelete} />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-background">
        <p className="text-sm text-muted-foreground">Loading agents...</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return <AgentGrid agents={agents} onDelete={onDelete} />;
  }

  return (
    <DataTable
      columns={columns}
      data={agents}
      getRowKey={(agent) => agent.id}
      loading={loading}
      emptyTitle="No agents found"
      emptyDescription="Add an agent to get started."
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={
        typeof total === "number" && total !== agents.length
      }
      className={TABLE_CLASS}
    />
  );
}
