
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
      <div className="flex min-h-[250px] flex-1 flex-col items-center justify-center rounded-lg border bg-background text-center">
        <UserRound className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">No agents found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add an agent to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-background p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="group min-w-0 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <Link
                    to={`/app/agents/${agent.id}`}
                    className="block truncate text-sm font-semibold hover:text-primary hover:underline"
                  >
                    {agent.name ?? "Unnamed Agent"}
                  </Link>

                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Agent #{agent.sl ?? "—"}
                  </p>
                </div>
              </div>

              <AgentActions agent={agent} onDelete={onDelete} />
            </div>

            <div className="mt-4 space-y-3 border-t pt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span>Agent Code</span>
                </div>

                <span className="truncate font-mono text-xs font-medium">
                  {agent.code ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>Phone</span>
                </div>

                <span className="truncate text-xs font-medium">
                  {agent.phone ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Created</span>
                </div>

                <span className="text-xs font-medium">
                  {formatDate(agent.created_at)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <AgentStatus active={Boolean(agent.is_active)} />

              <Link
                to={`/app/agents/${agent.id}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                View details
              </Link>
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
