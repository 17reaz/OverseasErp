import { useEffect, useState } from "react"

import { Plus, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { getStatusConfig } from "./module-configs"
import { fetchModuleRecords } from "./status-service"
import type { ModuleConfig, ModuleRecord } from "./types"


/* =========================================================
 * EXISTING RECORD BOX
 * ========================================================= */

function RecordBox({
  module,
  record,
}: {
  module: ModuleConfig
  record: ModuleRecord
}) {
  const status = module.mapStatus(record)
  const config = getStatusConfig(status)
  const date = (record[module.dateField] as string | null) ?? record.created_at

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{date ?? "—"}</p>

        <Badge variant={config.variant} className="text-[10px]">
          {config.label}
        </Badge>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {module.summary(record)}
      </p>
    </div>
  )
}


/* =========================================================
 * ADD NEW BOX (dashed placeholder card — opens the sheet)
 * ========================================================= */

function AddNewBox({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <Plus className="h-4 w-4" />
      <span className="text-xs font-medium">Add New</span>
    </button>
  )
}


/* =========================================================
 * MODULE RECORDS PANEL (inline, sits under the stepper)
 *
 * Shows existing records as boxes + an "Add New" box.
 * The panel itself never renders a form — clicking "Add New"
 * asks the parent to open the ModuleRecordsSheet instead.
 * ========================================================= */

export function ModuleRecordsPanel({
  module,
  candidateId,
  onClose,
  onAddNew,
}: {
  module: ModuleConfig
  candidateId: string
  onClose: () => void
  onAddNew: () => void
}) {
  const [records, setRecords] = useState<ModuleRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      setLoadingRecords(true)
      const data = await fetchModuleRecords(module.key, candidateId)

      if (!active) return

      setRecords(data)
      setLoadingRecords(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [module, candidateId])

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{module.title} Records</p>

        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {loadingRecords ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Loading records...
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <RecordBox key={record.id} module={module} record={record} />
          ))}

          <AddNewBox onClick={onAddNew} />
        </div>
      )}
    </div>
  )
}
