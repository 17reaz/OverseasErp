import { useState } from "react";
import {
  Check,
  Copy,
  Pencil,
  Trash2,
  X,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BmetRecord } from "../bmet-service";

interface CandidateInfo {
  id: string;
  name: string;
  passport_no: string;
}

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

function isComplete(record: BmetRecord) {
  return (
    record.pdo &&
    record.finger &&
    record.nominee &&
    record.bank &&
    record.bmet
  );
}

function ChecklistBadge({ checked }: { checked: boolean }) {
  return checked ? (
    <span className="inline-flex items-center justify-center">
      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    </span>
  ) : (
    <span className="inline-flex items-center justify-center">
      <X className="h-4 w-4 text-muted-foreground" />
    </span>
  );
}

function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
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
          {candidateMap.get(record.candidate_id)?.name ??
            "Unknown candidate"}
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

    {
      key: "pdo",
      header: "PDO",
      className: "w-[70px] text-center",
      cell: (record) => (
        <div className="flex justify-center">
          <ChecklistBadge checked={record.pdo} />
        </div>
      ),
    },

    {
      key: "finger",
      header: "Finger",
      className: "w-[80px] text-center",
      cell: (record) => (
        <div className="flex justify-center">
          <ChecklistBadge checked={record.finger} />
        </div>
      ),
    },

    {
      key: "nominee",
      header: "Nominee",
      className: "w-[85px] text-center",
      hideOnMobile: true,
      cell: (record) => (
        <div className="flex justify-center">
          <ChecklistBadge checked={record.nominee} />
        </div>
      ),
    },

    {
      key: "bank",
      header: "Bank",
      className: "w-[70px] text-center",
      hideOnMobile: true,
      cell: (record) => (
        <div className="flex justify-center">
          <ChecklistBadge checked={record.bank} />
        </div>
      ),
    },

    {
      key: "bmet",
      header: "BMET",
      className: "w-[70px] text-center",
      cell: (record) => (
        <div className="flex justify-center">
          <ChecklistBadge checked={record.bmet} />
        </div>
      ),
    },

    {
      key: "bmet_date",
      header: "BMET Date",
      hideOnMobile: true,
      cell: (record) => formatDate(record.bmet_date),
    },

    {
      key: "status",
      header: "Status",
      cell: (record) => {
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
      },
    },

    {
      key: "action",
      header: "Actions",
      className: "w-[80px] text-right",
      cell: (record) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Open BMET actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEdit(record)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

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
    />
  );
}