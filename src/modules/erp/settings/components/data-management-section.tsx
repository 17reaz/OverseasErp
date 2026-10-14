// src/modules/erp/settings/components/data-management-section.tsx

import { useRef } from "react";
import { Database } from "lucide-react";

import { ExportDataCard } from "./export-data-card";
import { ExportHistory, type ExportHistoryHandle } from "./export-history";
import { ImportDataCard } from "./import-data-card";
import { ImportHistory, type ImportHistoryHandle } from "./import-history";
import { SettingsCard, SettingsPageHeader } from "./settings-ui";

export function DataManagementSection() {
  const exportHistoryRef = useRef<ExportHistoryHandle>(null);
  const importHistoryRef = useRef<ImportHistoryHandle>(null);

  return (
    <div className="space-y-4">
      <SettingsPageHeader
        icon={Database}
        title="Data Management"
        description="Export your ERP data or import records from a file."
      />

      <SettingsCard>
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
          <div className="min-w-0 p-5">
            <ExportHistory ref={exportHistoryRef} />
          </div>

          <div className="min-w-0 p-5">
            <ImportHistory ref={importHistoryRef} />
          </div>
        </section>
      </SettingsCard>
    </div>
  );
}
