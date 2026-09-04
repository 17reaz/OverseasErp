// src/modules/erp/settings/components/export-history.tsx

import { useEffect, useImperativeHandle, useState, forwardRef } from "react";
import { Download, History, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { toast } from "@/components/shared/toast/toast";

import {
  getExportDownloadUrl,
  listExportJobs,
} from "../data-management-service";
import {
  EXPORT_TYPE_LABELS,
  type ExportJob,
  type ExportJobStatus,
} from "../data-management-types";

export interface ExportHistoryHandle {
  refresh: () => void;
}

const STATUS_VARIANT: Record<
  ExportJobStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  queued: "secondary",
  processing: "secondary",
  completed: "default",
  failed: "destructive",
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export const ExportHistory = forwardRef<ExportHistoryHandle>(
  function ExportHistory(_props, ref) {
    const [jobs, setJobs] = useState<ExportJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    async function load() {
      setLoading(true);
      try {
        setJobs(await listExportJobs());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    useEffect(() => {
      void load();
    }, []);

    useImperativeHandle(ref, () => ({ refresh: load }));

    async function handleDownload(job: ExportJob) {
      if (!job.file_path) return;
      setDownloadingId(job.id);

      try {
        const url = await getExportDownloadUrl(job.file_path);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.error(err);
        toast.error(
          "Failed to create download link.",
          err instanceof Error ? err.message : "Please try again.",
        );
      } finally {
        setDownloadingId(null);
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" />
            Export History
          </CardTitle>
          <CardDescription>Recent exports for this tenant.</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No exports yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Download</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(job.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{EXPORT_TYPE_LABELS[job.export_type]}</TableCell>
                      <TableCell className="uppercase">{job.format}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[job.status]}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.record_count ?? "—"}</TableCell>
                      <TableCell>{formatFileSize(job.file_size)}</TableCell>
                      <TableCell className="text-right">
                        {job.status === "completed" && job.file_path && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={downloadingId === job.id}
                            onClick={() => handleDownload(job)}
                            aria-label="Download"
                          >
                            {downloadingId === job.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Download className="size-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);
