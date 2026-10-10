import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

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

/**
 * Agents don't have an `sl` column in the database,
 * so we derive one from `created_at`.
 */
function buildSlMap(agents: Agent[]) {
  const bySl = [...agents].sort(
    (a, b) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime(),
  );

  const map = new Map<string, number>();

  bySl.forEach((agent, index) => {
    map.set(agent.id, index + 1);
  });

  return map;
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
          aria-label="Agent actions"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
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
  const slMap = buildSlMap(agents);

  const columns: DataTableColumn<Agent>[] = [
    {
      key: "sl",
      header: "SL",
      className: "w-[80px] font-medium",
      cell: (agent) => slMap.get(agent.id) ?? "—",
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