// src/modules/erp/settings/components/import-preview-sheet.tsx

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { toast } from "@/components/shared/toast/toast";

import { commitImport } from "../data-management-service";
import {
  IMPORT_TYPE_LABELS,
  type ImportJob,
} from "../data-management-types";

const MAX_VISIBLE_ERRORS = 50;

interface ImportPreviewSheetProps {
  job: ImportJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommitted?: (job: ImportJob) => void;
}

function StatBlock({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
  }[tone];

  return (
    <div className="rounded-lg border p-3 text-center">
      <div className={`text-xl font-semibold ${toneClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function ImportPreviewSheet({
  job,
  open,
  onOpenChange,
  onCommitted,
}: ImportPreviewSheetProps) {
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<ImportJob | null>(null);

  const activeJob = result ?? job;

  const actionCounts = useMemo(() => {
    const rows = activeJob?.validation_result?.rows ?? [];
    return {
      insert: rows.filter((r) => r.action === "insert").length,
      update: rows.filter((r) => r.action === "update").length,
      skip: rows.filter((r) => r.action === "skip").length,
    };
  }, [activeJob]);

  const errors = activeJob?.validation_result?.errors ?? [];
  const canCommit =
    activeJob?.status === "ready" && (activeJob?.valid_rows ?? 0) > 0;

  async function handleCommit() {
    if (!activeJob) return;

    setCommitting(true);

    try {
      const committed = await commitImport(activeJob.id);
      setResult(committed);

      toast.success(
        "Import committed.",
        `Inserted ${committed.inserted_rows}, updated ${committed.updated_rows}, skipped ${committed.skipped_rows}.`,
      );

      onCommitted?.(committed);
    } catch (err) {
      console.error(err);
      toast.error(
        "Failed to commit import.",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setCommitting(false);
    }
  }

  function handleClose() {
    if (committing) return;
    setResult(null);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && handleClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Import Preview</SheetTitle>

          <SheetDescription>
            {activeJob
              ? `${IMPORT_TYPE_LABELS[activeJob.import_type]} — ${activeJob.file_name}`
              : "Review the file before committing."}
          </SheetDescription>
        </SheetHeader>

        {activeJob && (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <StatBlock label="Total" value={activeJob.total_rows} />
              <StatBlock
                label="Valid"
                value={activeJob.valid_rows}
                tone="success"
              />
              <StatBlock
                label="Invalid"
                value={activeJob.invalid_rows}
                tone={activeJob.invalid_rows > 0 ? "danger" : "default"}
              />
              <StatBlock
                label={
                  activeJob.status === "completed" ? "Inserted" : "Will Insert"
                }
                value={
                  activeJob.status === "completed"
                    ? activeJob.inserted_rows
                    : actionCounts.insert
                }
              />
              <StatBlock
                label={
                  activeJob.status === "completed" ? "Updated" : "Will Update"
                }
                value={
                  activeJob.status === "completed"
                    ? activeJob.updated_rows
                    : actionCounts.update
                }
              />
              <StatBlock
                label={
                  activeJob.status === "completed" ? "Skipped" : "Will Skip"
                }
                value={
                  activeJob.status === "completed"
                    ? activeJob.skipped_rows
                    : actionCounts.skip
                }
              />
            </div>

            {activeJob.status === "completed" && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                This import has been committed.
              </div>
            )}

            {errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="size-4 text-destructive" />
                  Validation Errors ({errors.length})
                </div>

                <div className="max-h-80 overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {errors.slice(0, MAX_VISIBLE_ERRORS).map((error, i) => (
                        <TableRow key={i}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell>{error.field}</TableCell>
                          <TableCell className="max-w-32 truncate">
                            {String(error.value ?? "")}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit">
                                {error.code}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {error.message}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {errors.length > MAX_VISIBLE_ERRORS && (
                  <p className="text-xs text-muted-foreground">
                    Showing first {MAX_VISIBLE_ERRORS} of {errors.length}{" "}
                    errors.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <SheetFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={committing}
          >
            Close
          </Button>

          {canCommit && (
            <Button type="button" onClick={handleCommit} disabled={committing}>
              {committing && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Commit Import
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
