// src/modules/erp/settings/components/import-history.tsx

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { History, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

import { getImportJob, listImportJobs } from "../data-management-service";
import {
  IMPORT_TYPE_LABELS,
  type ImportJob,
  type ImportJobStatus,
} from "../data-management-types";

import { ImportPreviewSheet } from "./import-preview-sheet";

export interface ImportHistoryHandle {
  refresh: () => void;
}

const STATUS_VARIANT: Record<
  ImportJobStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  uploaded: "secondary",
  parsing: "secondary",
  validating: "secondary",
  ready: "outline",
  committing: "secondary",
  completed: "default",
  failed: "destructive",
  cancelled: "outline",
};

export const ImportHistory = forwardRef<ImportHistoryHandle>(
  function ImportHistory(_props, ref) {
    const [jobs, setJobs] = useState<ImportJob[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    async function load() {
      setLoading(true);
      try {
        setJobs(await listImportJobs());
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

    async function handleRowClick(job: ImportJob) {
      try {
        const fresh = await getImportJob(job.id);
        setSelectedJob(fresh);
        setPreviewOpen(true);
      } catch (err) {
        console.error(err);
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" />
            Import History
          </CardTitle>
          <CardDescription>
            Recent imports for this tenant. Click a row for details.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No imports yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Valid</TableHead>
                    <TableHead>Invalid</TableHead>
                    <TableHead>Inserted</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Skipped</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {jobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(job)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {new Date(job.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-40 truncate">
                        {job.file_name}
                      </TableCell>
                      <TableCell>{IMPORT_TYPE_LABELS[job.import_type]}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[job.status]}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.total_rows}</TableCell>
                      <TableCell>{job.valid_rows}</TableCell>
                      <TableCell>{job.invalid_rows}</TableCell>
                      <TableCell>{job.inserted_rows}</TableCell>
                      <TableCell>{job.updated_rows}</TableCell>
                      <TableCell>{job.skipped_rows}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        <ImportPreviewSheet
          job={selectedJob}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          onCommitted={() => {
            void load();
          }}
        />
      </Card>
    );
  },
);
