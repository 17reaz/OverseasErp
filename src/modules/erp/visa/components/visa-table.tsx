import { useRef, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  Eye,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { BmetRecord } from "../../bmet/bmet-service";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Visa } from "../visa-service";
import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";

interface CandidateOption {
  id: string;
  tenant_id: string;
  sl: number;
  name: string;
  passport_no: string;
}

interface AgencyOption {
  id: string;
  name: string;
}

interface VisaTableProps {
  records: Visa[];
  candidates: CandidateOption[];
  agencies: AgencyOption[];
  loading?: boolean;
  bmetRecords: BmetRecord[];
  page?: number;
  pageSize?: number;
  total?: number;
  visaCopyCandidateIds: ReadonlySet<string>;
  onPageChange?: (page: number) => void;
  onEdit: (record: Visa) => void;
  onDelete: (record: Visa) => void;
  onUploadCopy: (record: Visa, file: File) => Promise<void>;
  onOpenCopy: (record: Visa) => Promise<void>;
  onDownloadCopy: (record: Visa) => Promise<void>;
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const COPY_FIELDS = [
  "visa_copy_path",
  "visa_copy_url",
  "visa_copy",
  "copy_path",
  "copy_url",
  "file_path",
  "has_copy",
] as const;

function hasVisaCopy(record: Visa): boolean {
  const data = record as unknown as Record<string, unknown>;
  return COPY_FIELDS.some((field) => Boolean(data[field]));
}

function VisaActions({
  record,
  hasStoredCopy,
  onEdit,
  onDelete,
  onUploadCopy,
  onOpenCopy,
  onDownloadCopy,
}: {
  record: Visa;
  hasStoredCopy: boolean;
  onEdit: (record: Visa) => void;
  onDelete: (record: Visa) => void;
  onUploadCopy: (record: Visa, file: File) => Promise<void>;
  onOpenCopy: (record: Visa) => Promise<void>;
  onDownloadCopy: (record: Visa) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadedNow, setUploadedNow] = useState(false);

  const copyExists =
    hasVisaCopy(record) || hasStoredCopy || uploadedNow;

  async function runAction(action: () => Promise<void>) {
    setBusy(true);

    try {
      await action();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong.";

      window.alert(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex justify-end">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";

          if (file) {
            void runAction(async () => {
              await onUploadCopy(record, file);
              setUploadedNow(true);
            });
          }
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {copyExists ? (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  void runAction(() => onOpenCopy(record))
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View Visa Copy
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() =>
                  void runAction(() => onDownloadCopy(record))
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Download Visa Copy
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => fileInputRef.current?.click()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Replace Visa Copy
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onSelect={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Visa Copy
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => onEdit(record)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onDelete(record)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function VisaTable({
  records,
  candidates,
  agencies,
  loading = false,
  bmetRecords,
  page,
  pageSize = 10,
  total,
  onPageChange,
  onEdit,
  onDelete,
  onUploadCopy,
  onOpenCopy,
  onDownloadCopy,
  visaCopyCandidateIds,
}: VisaTableProps) {
  function getCandidate(id: string) {
    return candidates.find((candidate) => candidate.id === id);
  }

  function getAgency(id: string | null) {
    if (!id) return null;
    return agencies.find((agency) => agency.id === id);
  }

  const columns: DataTableColumn<Visa>[] = [
    {
      key: "sl",
      header: "SL",
      className: "font-medium",
      cell: (record) => record.sl,
    },
    {
      key: "candidate",
      header: "Candidate",
      cell: (record) => (
        <div className="max-w-[160px] truncate font-medium">
          {getCandidate(record.candidate_id)?.name ?? "Unknown"}
        </div>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      hideOnMobile: true,
      cell: (record) => (
        <span className="font-mono text-xs">
          {getCandidate(record.candidate_id)?.passport_no ?? "—"}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      className: "capitalize",
      hideOnMobile: true,
      cell: (record) => record.visa_type,
    },
    {
      key: "visa_date",
      header: "Visa Date",
      className: "whitespace-nowrap",
      cell: (record) => formatDate(record.visa_date),
    },
    {
      key: "expiry_date",
      header: "Expiry Date",
      className: "whitespace-nowrap",
      hideOnMobile: true,
      cell: (record) => formatDate(record.expiry_date),
    },
    {
      key: "manpower",
      header: "Manpower",
      hideOnMobile: true,
      cell: (record) => {
        const bmetRecord = bmetRecords.find(
          (item) => item.visa_id === record.id,
        );

        if (!bmetRecord) {
          return (
            <span className="text-muted-foreground">—</span>
          );
        }

        const isComplete = bmetRecord.bmet === true;

        return (
          <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isComplete
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }`}
          >
            {isComplete ? "Complete" : "Pending"}
          </span>
        );
      },
    },
    {
      key: "agency",
      header: "Agency",
      hideOnMobile: true,
      cell: (record) =>
        getAgency(record.agency_id)?.name ?? "—",
    },
    {
      key: "status",
      header: "Status",
      className: "capitalize",
      cell: (record) => (
        <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {record.status}
        </span>
      ),
    },
    {
      key: "action",
      header: "Actions",
      className: "w-[70px] text-right",
      cell: (record) => (
        <VisaActions
          record={record}
          hasStoredCopy={visaCopyCandidateIds.has(
            record.candidate_id,
          )}
          onEdit={onEdit}
          onDelete={onDelete}
          onUploadCopy={onUploadCopy}
          onOpenCopy={onOpenCopy}
          onDownloadCopy={onDownloadCopy}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      getRowKey={(record) => record.id}
      loading={loading}
      emptyTitle="No visa records found"
      emptyDescription="Create a visa record to get started."
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={
        typeof total === "number" && total !== records.length
      }
    />
  );
}
