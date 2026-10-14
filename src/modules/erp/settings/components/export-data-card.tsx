// src/modules/erp/settings/components/export-data-card.tsx

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { toast } from "@/components/shared/toast/toast";

import { exportData } from "../data-management-service";
import {
  EXPORT_TYPE_LABELS,
  type ExportType,
} from "../data-management-types";

import { SectionTitle } from "./settings-ui";

const MODULE_EXPORT_TYPES: ExportType[] = [
  "candidates",
  "agents",
  "agencies",
  "medical",
  "mofa",
  "visa",
  "flight",
];

interface ExportDataCardProps {
  onExported?: () => void;
}

export function ExportDataCard({ onExported }: ExportDataCardProps) {
  const [runningType, setRunningType] = useState<ExportType | null>(null);

  async function handleExport(exportType: ExportType) {
    setRunningType(exportType);

    try {
      const result = await exportData(exportType);

      toast.success(
        `${EXPORT_TYPE_LABELS[exportType]} export ready.`,
        `${result.job.record_count ?? 0} record(s) — download will open in a new tab.`,
      );

      window.open(result.signedUrl, "_blank", "noopener,noreferrer");
      onExported?.();
    } catch (err) {
      console.error(err);

      toast.error(
        `Failed to export ${EXPORT_TYPE_LABELS[exportType]}.`,
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setRunningType(null);
    }
  }

  const isBusy = runningType !== null;

  return (
    <div>
      <SectionTitle
        icon={FileSpreadsheet}
        title="Export Data"
        description="Generate an Excel (.xlsx) export of your tenant's data. Files are generated on the server and downloaded via a private, time-limited link."
      />

      <div className="space-y-4">
        <Button
          type="button"
          size="sm"
          className="w-full sm:w-auto"
          disabled={isBusy}
          onClick={() => handleExport("all")}
        >
          {runningType === "all" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Export All
        </Button>

        <Separator />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODULE_EXPORT_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => handleExport(type)}
            >
              {runningType === type ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <Download className="mr-2 size-3.5" />
              )}
              {EXPORT_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
