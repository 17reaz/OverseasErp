// src/modules/erp/settings/components/data-management-section.tsx

import { useRef } from "react";
import { Database } from "lucide-react";

import { ExportDataCard } from "./export-data-card";
import { ExportHistory, type ExportHistoryHandle } from "./export-history";
import { ImportDataCard } from "./import-data-card";
import { ImportHistory, type ImportHistoryHandle } from "./import-history";

export function DataManagementSection() {
  const exportHistoryRef = useRef<ExportHistoryHandle>(null);
  const importHistoryRef = useRef<ImportHistoryHandle>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">
          Data Management
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExportDataCard
          onExported={() => exportHistoryRef.current?.refresh()}
        />
        <ImportDataCard
          onImported={() => importHistoryRef.current?.refresh()}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExportHistory ref={exportHistoryRef} />
        <ImportHistory ref={importHistoryRef} />
      </div>
    </div>
  );
}
