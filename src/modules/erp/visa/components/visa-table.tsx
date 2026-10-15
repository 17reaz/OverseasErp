import { useRef, useState } from "react";
import {
  CheckCircle2,
  Pencil,
  Trash2,
  Upload,
  Eye,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { BmetRecord } from "../../bmet/bmet-service";
import { RowActions } from "../../shared/ui/actions/row-actions";
import type { Visa } from "../visa-service";
import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  onStatusChange: (
    record: Visa,
    status: string,
  ) => Promise<void>;
  visaCopyCandidateIds: ReadonlySet<string>;
  onPageChange?: (page: number) => void;
  onEdit: (record: Visa) => void;
  onDelete: (record: Visa) => void;
  onUploadCopy: (record: Visa, file: File) => Promise<void>;
  onOpenCopy: (record: Visa) => Promise<void>;
  onPreviewCopy: (record: Visa) => Promise<void>;
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

const VISA_STATUS_OPTIONS = [
  { value: "processing", label: "Processing" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
  { value: "delivered", label: "Delivered" },
] as const;

const VISA_STATUS_VARIANTS: Record<
  string,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  processing: "secondary",
  active: "default",
  delivered: "outline",
  expired: "destructive",
  cancelled: "destructive",
};

function VisaStatusBadge({ status }: { status: string }) {
  const label =
    VISA_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status;

  return (
    <Badge variant={VISA_STATUS_VARIANTS[status] ?? "outline"}>
      {label}
    </Badge>
  );
}


function hasVisaCopy(record: Visa): boolean {
  const data = record as unknown as Record<string, unknown>;

  return COPY_FIELDS.some((field) => Boolean(data[field]));
}

interface VisaActionsProps {
  record: Visa;
  hasStoredCopy: boolean;
  onEdit: (record: Visa) => void;
  onDelete: (record: Visa) => void;
  onStatusChange: (
    record: Visa,
    status: string,
  ) => Promise<void>;
  onPreviewCopy: (record: Visa) => Promise<void>;
  onUploadCopy: (record: Visa, file: File) => Promise<void>;
  onOpenCopy: (record: Visa) => Promise<void>;
  onDownloadCopy: (record: Visa) => Promise<void>;
}

function VisaActions({
  record,
  hasStoredCopy,
  onEdit,
  onDelete,
  onStatusChange,
  onUploadCopy,
  onOpenCopy,
  onDownloadCopy,
  onPreviewCopy,
}: VisaActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadedNow, setUploadedNow] = useState(false);

  const copyExists =
    hasVisaCopy(record) || hasStoredCopy || uploadedNow;

  const availableStatusOptions = VISA_STATUS_OPTIONS.filter(
    (option) => option.value !== record.status,
  );

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
  <div className="flex items-center justify-end gap-1">
    {copyExists && (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={busy}
        title="View Visa Copy"
        aria-label={`View Visa Copy for ${record.visa_no ?? record.id}`}
        onClick={() => void runAction(() => onPreviewCopy(record))}
      >
        <Download className="size-4" />
      </Button>
    )}
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

      <RowActions
        label={`Actions for visa ${record.visa_no ?? record.id}`}
        disabled={busy}
        triggerIcon={busy ? Loader2 : undefined}
        actions={[
          ...(copyExists
            ? [
                {
                  key: "view-copy",
                  label: "View Visa Copy",
                  icon: Eye,
                  onSelect: () =>
                    void runAction(() => onOpenCopy(record)),
                },
                {
                  key: "download-copy",
                  label: "Download Visa Copy",
                  icon: Download,
                  onSelect: () =>
                    void runAction(() => onDownloadCopy(record)),
                },
                {
                  key: "replace-copy",
                  label: "Replace Visa Copy",
                  icon: RefreshCw,
                  onSelect: () => fileInputRef.current?.click(),
                },
              ]
            : [
                {
                  key: "upload-copy",
                  label: "Upload Visa Copy",
                  icon: Upload,
                  onSelect: () => fileInputRef.current?.click(),
                },
              ]),

          ...availableStatusOptions.map((option, index) => ({
            key: `status-${option.value}`,
            label: `Change Status to ${option.label}`,
            icon: CheckCircle2,
            separatorBefore: index === 0,
            onSelect: () =>
              void runAction(() =>
                onStatusChange(record, option.value),
              ),
          })),

          {
            key: "edit",
            label: "Edit",
            icon: Pencil,
            separatorBefore: true,
            onSelect: () => onEdit(record),
          },
          {
            key: "delete",
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onSelect: () => onDelete(record),
          },
        ]}
      />
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
  onStatusChange,
   onUploadCopy,
  onOpenCopy,
  onPreviewCopy,
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
  cell: (record) => <VisaStatusBadge status={record.status} />,
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
          onStatusChange={onStatusChange}
          onUploadCopy={onUploadCopy}
          onOpenCopy={onOpenCopy}
          onPreviewCopy={onPreviewCopy}
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