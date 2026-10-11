import { AlertCircle, CheckCircle2, Gauge, ScanLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-muted p-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none tabular-nums">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
