import { useRef, useState, type ComponentProps } from "react";
import {
  CheckCircle2,
  Pencil,
  Trash2,
  Upload,
  Eye,
  Download,
  Users,
  Loader2,
  RefreshCw,
  PlaneTakeoff,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

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
  onStatusChange: (record: Visa, status: string) => Promise<void>;
  onEdit: (record: Visa) => void;
  onDelete: (record: Visa) => void;
  onUploadCopy: (record: Visa, file: File) => Promise<void>;
  onOpenCopy: (record: Visa) => Promise<void>;
  onPreviewCopy: (record: Visa) => Promise<void>;
  onDownloadCopy: (record: Visa) => Promise<void>;
  onManageManpower: (record: Visa) => void;
  onCreateFlight: (record: Visa) => void;
}

type RowAction = ComponentProps<typeof RowActions>["actions"][number];

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

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
  ComponentProps<typeof Badge>["variant"]
> = {
  processing: "secondary",
  active: "default",
  delivered: "outline",
  expired: "destructive",
  cancelled: "destructive",
};

const MANPOWER_STYLES = {
  muted: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  orange: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
} as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

interface StatusDisplay {
  label: string;
  className: string;
}

function getManpowerStatus(record?: BmetRecord | null): StatusDisplay {
  if (!record) {
    return { label: "Not Created", className: MANPOWER_STYLES.muted };
  }

  if (record.bmet) {
    return { label: "Complete", className: MANPOWER_STYLES.success };
  }

  // First missing step decides the label.
  const pendingStep = (
    [
      ["pdo", "PDO"],
      ["finger", "Finger"],
      ["nominee", "Nominee"],
      ["bank", "Bank"],
    ] as const
  ).find(([key]) => !record[key]);

  if (pendingStep) {
    return { label: pendingStep[1], className: MANPOWER_STYLES.warning };
  }

  return { label: "Submitted", className: MANPOWER_STYLES.info };
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

function hasVisaCopy(record: Visa): boolean {
  const data = record as unknown as Record<string, unknown>;

  return COPY_FIELDS.some((field) => Boolean(data[field]));
}

/** Joins action groups and puts a separator between each non-empty group. */
function joinActionGroups(groups: RowAction[][]): RowAction[] {
  return groups
    .filter((group) => group.length > 0)
    .flatMap((group, groupIndex) =>
      group.map((action, index) => ({
        ...action,
        separatorBefore: groupIndex > 0 && index === 0,
      })),
    );
}

/* -------------------------------------------------------------------------- */
/*  Status badge                                                              */
/* -------------------------------------------------------------------------- */

function VisaStatusBadge({ status }: { status: string }) {
  const label =
    VISA_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status;

  return (
    <Badge variant={VISA_STATUS_VARIANTS[status] ?? "outline"}>{label}</Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Row actions                                                               */
/* -------------------------------------------------------------------------- */

interface VisaActionsProps {
  record: Visa;
  hasStoredCopy: boolean;
  onEdit: (record: Visa) => void;
  onDelete: (record: Visa) => void;
  onStatusChange: (record: Visa, status: string) => Promise<void>;
  onPreviewCopy: (record: Visa) => Promise<void>;
  onUploadCopy: (record: Visa, file: File) => Promise<void>;
  onOpenCopy: (record: Visa) => Promise<void>;
  onDownloadCopy: (record: Visa) => Promise<void>;
  onManageManpower: (record: Visa) => void;
  onCreateFlight: (record: Visa) => void;
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
  onManageManpower,
   onCreateFlight,
}: VisaActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadedNow, setUploadedNow] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const copyExists = hasVisaCopy(record) || hasStoredCopy || uploadedNow;

  async function runAction(action: () => Promise<void>) {
    setBusy(true);

    try {
      await action();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  const pickFile = () => fileInputRef.current?.click();

  /* ---- Menu groups ------------------------------------------------------ */

  // 1. Visa copy
  const copyActions: RowAction[] = copyExists
    ? [
        {
          key: "view-copy",
          label: "View Visa Copy",
          icon: Eye,
          onSelect: () => void runAction(() => onOpenCopy(record)),
        },
        {
          key: "download-copy",
          label: "Download Visa Copy",
          icon: Download,
          onSelect: () => void runAction(() => onDownloadCopy(record)),
        },
        {
          key: "replace-copy",
          label: "Replace Visa Copy",
          icon: RefreshCw,
          onSelect: pickFile,
        },
      ]
    : [
        {
          key: "upload-copy",
          label: "Upload Visa Copy",
          icon: Upload,
          onSelect: pickFile,
        },
      ];

  // 2. Manpower
  const manpowerActions: RowAction[] = [
    {
      key: "manage-manpower",
      label: "Manpower: Connect / Create",
      icon: Users,
      onSelect: () => onManageManpower(record),
    },
  ];
    // Create Flight
  const flightActions: RowAction[] = [
    {
      key: "create-flight",
      label: "Create Flight",
      icon: PlaneTakeoff,
      onSelect: () => onCreateFlight(record),
    },
  ];
  // 3. Status (single entry, options open in a dialog)
  const availableStatusOptions = VISA_STATUS_OPTIONS.filter(
    (option) => option.value !== record.status,
  );

  const statusActions: RowAction[] = [
    {
      key: "change-status",
      label: "Change Status",
      icon: CheckCircle2,
      onSelect: () => setStatusDialogOpen(true),
    },
  ];

  // 4. Edit
  const editActions: RowAction[] = [
    {
      key: "edit",
      label: "Edit",
      icon: Pencil,
      onSelect: () => onEdit(record),
    },
  ];

  // 5. Danger zone
  const dangerActions: RowAction[] = [
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      destructive: true,
      onSelect: () => onDelete(record),
    },
  ];

  const actions = joinActionGroups([
    copyActions,
    manpowerActions,
     flightActions,
    statusActions,
    editActions,
    dangerActions,
  ]);

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
          <Eye className="size-4" />
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
        actions={actions}
      />

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Current: <VisaStatusBadge status={record.status} />
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {availableStatusOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                className="justify-start"
                disabled={busy}
                onClick={() => {
                  setStatusDialogOpen(false);
                  void runAction(() => onStatusChange(record, option.value));
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Table                                                                     */
/* -------------------------------------------------------------------------- */

export function VisaTable({
  records,
  candidates,
  agencies,
  loading = false,
  bmetRecords,
  page,
  pageSize = 10,
  total,
  visaCopyCandidateIds,
  onPageChange,
  onEdit,
  onDelete,
  onStatusChange,
  onUploadCopy,
  onOpenCopy,
  onPreviewCopy,
  onDownloadCopy,
  onManageManpower,
    onCreateFlight,
}: VisaTableProps) {
  const getCandidate = (id: string) =>
    candidates.find((candidate) => candidate.id === id);

  const getAgency = (id: string | null) =>
    id ? agencies.find((agency) => agency.id === id) : null;

  function getManpowerDisplay(record: Visa): StatusDisplay {
    const linkedRecord = bmetRecords.find((item) => item.visa_id === record.id);
    const candidateRecord = bmetRecords.find(
      (item) => item.candidate_id === record.candidate_id,
    );

    if (!linkedRecord && candidateRecord) {
      return { label: "Not Linked", className: MANPOWER_STYLES.orange };
    }

    return getManpowerStatus(linkedRecord ?? candidateRecord);
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
        const { label, className } = getManpowerDisplay(record);

        return (
          <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: "agency",
      header: "Agency",
      hideOnMobile: true,
      cell: (record) => getAgency(record.agency_id)?.name ?? "—",
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
          hasStoredCopy={visaCopyCandidateIds.has(record.candidate_id)}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onUploadCopy={onUploadCopy}
          onOpenCopy={onOpenCopy}
          onPreviewCopy={onPreviewCopy}
          onDownloadCopy={onDownloadCopy}
          onManageManpower={onManageManpower}
                    onCreateFlight={onCreateFlight}
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
