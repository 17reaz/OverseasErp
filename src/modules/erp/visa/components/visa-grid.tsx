import {
  CalendarDays,
  FileCheck2,
  MoreHorizontal,
  Pencil,
  Plane,
  Trash2,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Visa } from "../visa-service";

interface Candidate {
  id: string;
  name?: string | null;
  passport_no?: string | null;
}

interface VisaGridProps {
  records: Visa[];
  candidates: Candidate[];
  loading?: boolean;
  onEdit: (record: Visa) => void;
  onDelete: (record: Visa) => void;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status?: string | null) {
  if (!status) return "Pending";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "approved":
    case "issued":
    case "active":
    case "granted":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

    case "rejected":
    case "cancelled":
    case "expired":
      return "border-destructive/20 bg-destructive/10 text-destructive";

    case "processing":
    case "in_progress":
    case "under_review":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";

    default:
      return "border-muted-foreground/20 bg-muted text-muted-foreground";
  }
}

function getCandidate(
  candidateId: string,
  candidates: Candidate[],
) {
  return candidates.find(
    (candidate) => candidate.id === candidateId,
  );
}

export function VisaGrid({
  records,
  candidates,
  loading = false,
  onEdit,
  onDelete,
}: VisaGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card
            key={index}
            className="overflow-hidden"
          >
            <CardHeader className="space-y-3">
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="h-10 animate-pulse rounded-lg bg-muted" />

              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 animate-pulse rounded-lg bg-muted" />
                <div className="h-12 animate-pulse rounded-lg bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed bg-muted/20">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
            <FileCheck2 className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="text-sm font-medium">
            No visa records found
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Visa records will appear here once created.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {records.map((record) => {
        const candidate = getCandidate(
          record.candidate_id,
          candidates,
        );

        return (
          <Card
            key={record.id}
            className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* HEADER */}

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {candidate?.name ?? "Unknown Candidate"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {candidate?.passport_no ??
                        "No passport number"}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />

                      <span className="sr-only">
                        Visa actions
                      </span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEdit(record)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(record)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* VISA STATUS */}

              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FileCheck2 className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">
                      Visa Number
                    </p>

                    <p className="truncate text-sm font-medium">
                      {record.visa_no ?? "Not assigned"}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={getStatusClass(record.status)}
                >
                  {getStatusLabel(record.status)}
                </Badge>
              </div>

              {/* DATE INFORMATION */}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-background px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />

                    <span className="text-[11px]">
                      Visa Date
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium">
                    {formatDate(record.visa_date)}
                  </p>
                </div>

                <div className="rounded-lg border bg-background px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />

                    <span className="text-[11px]">
                      Expiry
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium">
                    {formatDate(record.expiry_date)}
                  </p>
                </div>
              </div>

              {/* PIPELINE FOOTER */}

              <div className="flex items-center gap-2 border-t pt-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">
                    Visa Stage
                  </p>

                  <p className="truncate text-xs font-medium">
                    {getStatusLabel(record.status)}
                  </p>
                </div>

                <span className="text-[11px] text-muted-foreground">
                  Visa
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}