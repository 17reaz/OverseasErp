// src/modules/erp/dashboard/components/dashboard-table.tsx

import { ArrowUpRight, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { DashboardCandidate } from "../dashboard-service";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

interface Props {
  candidates: DashboardCandidate[];
  loading?: boolean;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStageLabel(stage: string | null) {
  if (!stage) return "Not started";

  return stage
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DashboardTable({ candidates, loading = false }: Props) {
  const columns: DataTableColumn<DashboardCandidate>[] = [
    {
      key: "candidate",
      header: "Candidate",
      cell: (candidate) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted">
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <p className="font-medium">{candidate.name}</p>

            <p className="text-xs text-muted-foreground">
              {candidate.id.slice(0, 8)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      hideOnMobile: true,
      cell: (candidate) => (
        <span className="font-mono text-xs">{candidate.passport_no}</span>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      hideOnMobile: true,
      cell: (candidate) => getStageLabel(candidate.current_stage),
    },
    {
      key: "received",
      header: "Received",
      className: "text-muted-foreground",
      cell: (candidate) => formatDate(candidate.created_at),
    },
    {
      key: "status",
      header: "Status",
      className: "text-right",
      cell: (candidate) => (
        <div className="flex items-center justify-end gap-2">
          <Badge variant={candidate.is_returned ? "destructive" : "secondary"}>
            {candidate.is_returned ? "Returned" : "Active"}
          </Badge>

          <Button variant="ghost" size="icon">
            <ArrowUpRight />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b px-5 py-4">
        <CardTitle>Recent Candidates</CardTitle>

        <p className="text-sm text-muted-foreground">
          Recently created candidate records.
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={candidates}
          getRowKey={(candidate) => candidate.id}
          loading={loading}
          emptyTitle="No candidates yet"
          emptyDescription="Candidate records will appear here."
          paginate={false}
          className="flex flex-col"
        />
      </CardContent>
    </Card>
  );
}