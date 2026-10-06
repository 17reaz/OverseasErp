// src/modules/erp/settings/components/data-management-section.tsx

import { useRef } from "react";
import { Database } from "lucide-react";

import { Card } from "@/components/ui/card";

import { ExportDataCard } from "./export-data-card";
import { ExportHistory, type ExportHistoryHandle } from "./export-history";
import { ImportDataCard } from "./import-data-card";
import { ImportHistory, type ImportHistoryHandle } from "./import-history";

export function DataManagementSection() {
  const exportHistoryRef = useRef<ExportHistoryHandle>(null);
  const importHistoryRef = useRef<ImportHistoryHandle>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Database className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Data Management</h2>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Export your ERP data or import records from a file.
        </p>
      </div>

      <Card className="divide-y overflow-hidden">
        {/* Export + Import */}
        <section className="grid lg:grid-cols-2 lg:divide-x">
          <div className="p-5">
            <ExportDataCard
              onExported={() => exportHistoryRef.current?.refresh()}
            />
          </div>

          <div className="p-5">
            <ImportDataCard
              onImported={() => importHistoryRef.current?.refresh()}
            />
          </div>
        </section>

        {/* Histories */}
        <section className="grid bg-muted/20 lg:grid-cols-2 lg:divide-x">
          <div className="p-5">
            <ExportHistory ref={exportHistoryRef} />
          </div>

          <div className="p-5">
            <ImportHistory ref={importHistoryRef} />
          </div>
        </section>
      </Card>
    </div>
  );
}