import { AlertCircle, CheckCircle2, Gauge, ScanLine } from "lucide-react";
import type { OcrScan } from "../types";

export function OcrStats({ scans }: { scans: OcrScan[] }) {
  const scored = scans.filter((s) => s.confidence > 0);
  const avg = scored.length
    ? Math.round(scored.reduce((a, s) => a + s.confidence, 0) / scored.length)
    : 0;

  const items = [
    { label: "Total scans", value: scans.length, icon: ScanLine },
    {
      label: "Needs review",
      value: scans.filter((s) => s.status === "needs_review").length,
      icon: AlertCircle,
    },
    {
      label: "Approved",
      value: scans.filter((s) => s.status === "approved").length,
      icon: CheckCircle2,
    },
    { label: "Average confidence", value: `${avg}%`, icon: Gauge },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border text-sm sm:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-center gap-2 bg-background px-3 py-2">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-semibold tabular-nums">{value}</span>
          <span className="truncate text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
