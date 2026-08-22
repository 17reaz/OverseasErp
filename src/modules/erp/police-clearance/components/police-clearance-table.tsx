import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { PoliceClearance } from "../police-clearance-service";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface PoliceClearanceTableProps {
  records: PoliceClearance[];
  candidates: CandidateOption[];
  loading?: boolean;
  onEdit: (record: PoliceClearance) => void;
  onDelete: (record: PoliceClearance) => void;
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function PoliceClearanceTable({
  records,
  candidates,
  loading = false,
  onEdit,
  onDelete,
}: PoliceClearanceTableProps) {
  function getCandidate(
    candidateId: string,
  ) {
    return candidates.find(
      (candidate) =>
        candidate.id === candidateId,
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border">
        <p className="text-sm text-muted-foreground">
          Loading police clearances...
        </p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border">
        <div className="text-center">
          <p className="text-sm font-medium">
            No police clearance records found.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Create a PCC record to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden rounded-md border">
      <div className="h-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b">
              <th className="h-11 px-4 text-left font-medium">
                SL
              </th>

              <th className="h-11 px-4 text-left font-medium">
                Candidate
              </th>

              <th className="h-11 px-4 text-left font-medium">
                Passport
              </th>

              <th className="h-11 px-4 text-left font-medium">
                Received
              </th>

              <th className="h-11 px-4 text-left font-medium">
                Verification
              </th>

              <th className="h-11 px-4 text-left font-medium">
                Verified Date
              </th>

              <th className="h-11 px-4 text-left font-medium">
                Remarks
              </th>

              <th className="h-11 w-[70px] px-4 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => {
              const candidate =
                getCandidate(
                  record.candidate_id,
                );

              return (
                <tr
                  key={record.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  {/* SL */}
                  <td className="px-4 py-3 font-medium">
                    {record.sl}
                  </td>

                  {/* Candidate */}
                  <td className="px-4 py-3">
                    <div className="max-w-[220px] truncate font-medium">
                      {candidate?.name ?? "Unknown"}
                    </div>
                  </td>

                  {/* Passport */}
                  <td className="px-4 py-3 font-mono text-xs">
                    {candidate?.passport_no ?? "—"}
                  </td>

                  {/* Received */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(
                      record.received_date,
                    )}
                  </td>

                  {/* Verification */}
                  <td className="px-4 py-3">
                    {record.verified ? (
                      <span className="inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                        Pending
                      </span>
                    )}
                  </td>

                  {/* Verified Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(
                      record.verified_date,
                    )}
                  </td>

                  {/* Remarks */}
                  <td className="max-w-[280px] px-4 py-3">
                    <span
                      className="block truncate text-muted-foreground"
                      title={
                        record.remarks ?? ""
                      }
                    >
                      {record.remarks || "—"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for PCC ${record.sl}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            onEdit(record)
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            onDelete(record)
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}