// src/modules/erp/agents/components/agent-table.tsx

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Agent } from "../types";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

interface AgentTableProps {
  agents: Agent[];
  loading?: boolean;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onDelete: (id: number) => void;
}

/**
 * Agents don't have an `sl` column in the database, so we derive one
 * from `created_at` — earliest created agent becomes SL 1, and so on.
 * This is independent of however the list is currently sorted for
 * display (e.g. newest-first).
 */
function buildSlMap(agents: Agent[]) {
  const bySl = [...agents].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const map = new Map<number, number>();

  bySl.forEach((agent, index) => {
    map.set(agent.id, index + 1);
  });

  return map;
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
      cell: (agent) => agent.name ?? "—",
    },
    {
      key: "action",
      header: "Actions",
      className: "w-[80px] text-right",
      cell: (agent) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(agent.id)}
          aria-label="Delete agent"
        >
          <Trash2 />
        </Button>
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
      serverPagination={typeof total === "number" && total !== agents.length}
    />
  );
}