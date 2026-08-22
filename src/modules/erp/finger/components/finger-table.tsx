import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  FingerRecord,
  FingerStatus,
} from "../finger-service";

interface CandidateInfo {
  id: string;
  name: string;
  passport_no: string;
}

interface FingerTableProps {
  records: FingerRecord[];
  candidates: CandidateInfo[];
  loading?: boolean;
  onEdit: (record: FingerRecord) => void;
  onDelete: (record: FingerRecord) => void;
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getStatusLabel(status: FingerStatus) {
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

function getStatusClassName(
  status: FingerStatus,
) {
  switch (status) {
    case "completed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";

    case "scheduled":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400";

    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400";

    case "cancelled":
      return "border-muted-foreground/30 bg-muted text-muted-foreground";

    case "pending":
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }
}

export function FingerTable({
  records,
  candidates,
  loading = false,
  onEdit,
  onDelete,
}: FingerTableProps) {
  const candidateMap = new Map(
    candidates.map((candidate) => [
      candidate.id,
      candidate,
    ]),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      {/* Scrollable table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-[80px]">
                SL
              </TableHead>

              <TableHead>
                Candidate
              </TableHead>

              <TableHead>
                Passport
              </TableHead>

              <TableHead>
                Finger Date
              </TableHead>

              <TableHead>
                Type
              </TableHead>

              <TableHead>
                Status
              </TableHead>

              <TableHead>
                Remarks
              </TableHead>

              <TableHead className="w-[110px] text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  Loading finger records...
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  No finger records found.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const candidate =
                  candidateMap.get(
                    record.candidate_id,
                  );

                return (
                  <TableRow key={record.id}>
                    {/* SL */}
                    <TableCell className="font-medium">
                      {record.sl}
                    </TableCell>

                    {/* Candidate */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {candidate?.name ??
                            "Unknown candidate"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Passport */}
                    <TableCell className="font-mono text-sm">
                      {candidate?.passport_no ?? "—"}
                    </TableCell>

                    {/* Finger Date */}
                    <TableCell>
                      {formatDate(
                        record.finger_date,
                      )}
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <Badge variant="outline">
                        {record.finger_type ===
                        "fresh"
                          ? "Fresh"
                          : "Existing"}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusClassName(
                          record.status,
                        )}
                      >
                        {getStatusLabel(
                          record.status,
                        )}
                      </Badge>
                    </TableCell>

                    {/* Remarks */}
                    <TableCell className="max-w-[240px]">
                      <span
                        className="block truncate"
                        title={
                          record.remarks ?? undefined
                        }
                      >
                        {record.remarks || "—"}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onEdit(record)
                          }
                          aria-label="Edit finger record"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            onDelete(record)
                          }
                          aria-label="Delete finger record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Fixed footer */}
      <div className="flex h-12 shrink-0 items-center justify-between border-t bg-background px-4 text-sm text-muted-foreground">
        <span>
          {records.length} record
          {records.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}