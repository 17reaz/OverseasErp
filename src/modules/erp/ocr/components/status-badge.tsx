import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScanStatus } from "../types";

const STATUS: Record<ScanStatus, { label: string; className: string }> = {
  processing: {
    label: "Processing",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  },
  needs_review: {
    label: "Needs review",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  approved: {
    label: "Approved",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  },
  failed: {
    label: "Failed",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  },
};

export function StatusBadge({ status }: { status: ScanStatus }) {
  const s = STATUS[status];
  return (
    <Badge variant="outline" className={cn("font-medium", s.className)}>
      {s.label}
    </Badge>
  );
}

export function ConfidenceText({ value }: { value: number }) {
  if (!value) return <span className="text-muted-foreground">-</span>;
  const tone =
    value >= 90
      ? "text-emerald-600 dark:text-emerald-400"
      : value >= 75
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  return <span className={cn("tabular-nums font-medium", tone)}>{value}%</span>;
}
