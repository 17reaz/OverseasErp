import { useRef, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  Pencil,
  Trash2,
  X,
  Eye,
  MoreHorizontal,
  Upload,
  Download,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";
import type { BmetRecord } from "../bmet-service";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface CandidateInfo {
  id: string;
  name: string;
  passport_no: string;
}
const TABLE_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background";
interface BmetTableProps {
  records: BmetRecord[];
  candidates: CandidateInfo[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onEdit: (record: BmetRecord) => void;
  onDelete: (record: BmetRecord) => void;
  bmetCopyCandidateIds: Set<string>;
  onUploadCopy: (record: BmetRecord, file: File) => Promise<void>;
  onOpenCopy: (record: BmetRecord) => Promise<void>;
  onDownloadCopy: (record: BmetRecord) => Promise<void>;
}

type ChecklistField = "pdo" | "finger" | "nominee" | "bank" | "bmet";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function isComplete(record: BmetRecord) {
  return (
    record.pdo &&
    record.finger &&
    record.nominee &&
    record.bank &&
    record.bmet
  );
}

/* -------------------------------------------------------------------------- */
/*  Small components                                                          */
/* -------------------------------------------------------------------------- */

function ChecklistBadge({ checked }: { checked: boolean }) {
  return (
    <span className="inline-flex items-center justify-center">
      {checked ? (
        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0"
      onClick={() => void handleCopy()}
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

function ContactCell({ record }: { record: BmetRecord }) {
  const phone = record.phone_number;
  const password = record.password;

  if (!phone && !password) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center gap-0.5">
      {phone ? (
        <>
          <span className="whitespace-nowrap text-sm">{phone}</span>
          <CopyButton value={phone} label="phone number" />
        </>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}

      {password && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              aria-label="Show BMET password"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>

          <PopoverContent align="start" className="w-auto min-w-48 p-3">
            <p className="mb-1.5 text-xs text-muted-foreground">
              BMET Password
            </p>
            <div className="flex items-center gap-1">
              <span className="select-all break-all font-mono text-sm">
                {password}
              </span>
              <CopyButton value={password} label="password" />
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function VisaField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={className}>{children}</div>
    </div>
  );
}

function VisaCell({ record }: { record: BmetRecord }) {
  const visa = record.visa;

  if (!record.visa_id || !visa) {
    return <span className="text-xs text-muted-foreground">No Visa</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex flex-col items-start gap-1 rounded-md p-1 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`View visa details for SL-${visa.sl}`}
        >
          {visa.visa_date && (
            <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
              {visa.visa_date}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold">Visa Information</p>
            <p className="text-xs text-muted-foreground">
              Complete visa details
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <VisaField label="SL" className="font-medium">
              {visa.sl}
            </VisaField>

            <VisaField label="Visa No" className="break-all font-medium">
              {visa.visa_no || "—"}
            </VisaField>

            <VisaField label="Visa Date">{visa.visa_date || "—"}</VisaField>

            <VisaField label="Expiry Date">
              {visa.expiry_date || "—"}
            </VisaField>

            <VisaField label="Type" className="capitalize">
              {visa.visa_type || "—"}
            </VisaField>

            <VisaField label="Status">
              <Badge variant="outline" className="mt-1">
                {visa.status || "—"}
              </Badge>
            </VisaField>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StatusBadge({ record }: { record: BmetRecord }) {
  const complete = isComplete(record);

  return (
    <Badge
      variant="outline"
      className={
        complete
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      }
    >
      {complete ? "Complete" : "Pending"}
    </Badge>
  );
}


function BmetActions({
  record,
  hasCopy,
  onEdit,
  onDelete,
  onUploadCopy,
  onOpenCopy,
  onDownloadCopy,
}: {
  record: BmetRecord;
  hasCopy: boolean;
  onEdit: (record: BmetRecord) => void;
  onDelete: (record: BmetRecord) => void;
  onUploadCopy: (record: BmetRecord, file: File) => Promise<void>;
  onOpenCopy: (record: BmetRecord) => Promise<void>;
  onDownloadCopy: (record: BmetRecord) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload(file?: File) {
    if (!file) return;

    if (!record.bmet) {
      window.alert("BMET status OK হলে তবেই card upload করা যাবে।");
      return;
    }

    setBusy(true);

    try {
      await onUploadCopy(record, file);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "BMET card upload করা যায়নি।",
      );
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function runAction(
    action: (record: BmetRecord) => Promise<void>,
  ) {
    setBusy(true);

    try {
      await action(record);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "BMET card action ব্যর্থ হয়েছে।",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(event) => {
          void handleUpload(event.target.files?.[0]);
        }}
      />

      {hasCopy && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="View BMET Card"
          aria-label="View BMET Card"
          disabled={busy}
          onClick={() => void runAction(onOpenCopy)}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Open BMET actions"
            disabled={busy}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          {record.bmet && (
            <DropdownMenuItem
              onSelect={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {hasCopy ? "Replace BMET Card" : "Upload BMET Card"}
            </DropdownMenuItem>
          )}

          {hasCopy && (
            <>
              <DropdownMenuItem
                onClick={() => void runAction(onOpenCopy)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View BMET Card
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => void runAction(onDownloadCopy)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download BMET Card
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => onEdit(record)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => onDelete(record)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Column factory for the PDO / Finger / Nominee / Bank / BMET checkmarks    */
/* -------------------------------------------------------------------------- */

function checklistColumn(
  field: ChecklistField,
  header: string,
  widthClass: string,
  hideOnMobile = false,
): DataTableColumn<BmetRecord> {
  return {
    key: field,
    header,
    className: `${widthClass} text-center`,
    hideOnMobile,
    
cell: (record) => {
  if (
    field === "pdo" &&
    !isComplete(record) &&
    record.pdo_date
  ) {
    return (
      <div className="text-center">
        <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
          {formatDate(record.pdo_date)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <ChecklistBadge checked={record[field]} />
    </div>
  );
},

  };
}

/* -------------------------------------------------------------------------- */
/*  Table                                                                     */
/* -------------------------------------------------------------------------- */

export function BmetTable({
  records,
  candidates,
  loading = false,
  page,
  pageSize = 10,
  total,
  onPageChange,
  onEdit,
  onDelete,
  bmetCopyCandidateIds,
  onUploadCopy,
  onOpenCopy,
  onDownloadCopy,
}: BmetTableProps) {
  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );

  const columns: DataTableColumn<BmetRecord>[] = [
    {
      key: "candidate",
      header: "Candidate",
      cell: (record) => (
        <span className="font-medium">
          {candidateMap.get(record.candidate_id)?.name ?? "Unknown candidate"}
        </span>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      hideOnMobile: true,
      cell: (record) => (
        <span className="font-mono text-sm">
          {candidateMap.get(record.candidate_id)?.passport_no ?? "—"}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Phone / Password",
      hideOnMobile: true,
      cell: (record) => <ContactCell record={record} />,
    },

    checklistColumn("pdo", "PDO", "w-[70px]"),
    checklistColumn("finger", "Finger", "w-[80px]"),
    checklistColumn("nominee", "Nominee", "w-[85px]", true),
    checklistColumn("bank", "Bank", "w-[70px]", true),

    {
      key: "visa",
      header: "Visa",
      cell: (record) => <VisaCell record={record} />,
    },

    checklistColumn("bmet", "BMET", "w-[70px]"),

    {
      key: "bmet_date",
      header: "BMET Date",
      hideOnMobile: true,
      cell: (record) => formatDate(record.bmet_date),
    },
    {
      key: "status",
      header: "Status",
      cell: (record) => <StatusBadge record={record} />,
    },
    {
      key: "action",
      header: "Actions",
      className: "w-[80px] text-right",
      cell: (record) => (
  <BmetActions
    record={record}
    hasCopy={bmetCopyCandidateIds.has(record.candidate_id)}
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
      emptyTitle="No BMET records found"
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={
        typeof total === "number" && total !== records.length
      }
      className={TABLE_CLASS}
    />
  );
}
