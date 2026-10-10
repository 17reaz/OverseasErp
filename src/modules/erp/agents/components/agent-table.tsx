import { useState } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Agent } from "../types";

import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";

interface AgentTableProps {
  agents: Agent[];
  loading?: boolean;

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

export function AgentTable({
  agents,
  loading = false,

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
      cell: (agent) =>
        agent.is_active ? (
          <span className="inline-flex h-5 items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        ) : (
          <span className="inline-flex h-5 items-center rounded-full border border-muted-foreground/30 bg-muted px-2 text-[11px] font-medium text-muted-foreground">
            Inactive
          </span>
        ),
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
    />
  );
}