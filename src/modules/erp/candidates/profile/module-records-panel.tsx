import { useEffect, useMemo, useState, type FormEvent } from "react"

import { ArrowLeft, Loader2, Plus, X } from "lucide-react"

import { toast } from "@/components/shared/toast/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"

import { getStatusConfig } from "./module-configs"
import { fetchModuleRecords } from "./status-service"
import type { FieldValues, ModuleConfig, ModuleRecord } from "./types"


type PanelMode = "list" | "form"


/* =========================================================
 * ADD / EDIT FORM FIELDS (same as before)
 * ========================================================= */

function ModuleFormFields({
  module,
  values,
  setField,
}: {
  module: ModuleConfig
  values: FieldValues
  setField: (key: string, value: string | boolean) => void
}) {
  return (
    <div className="space-y-4">
      {module.fields.map((field) => {
        if (field.showIf && !field.showIf(values)) {
          return null
        }

        const inputId = `${module.key}-${field.key}`

        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={inputId}>
              {field.label}
              {field.required && " *"}
            </Label>

            {field.type === "text" && (
              <Input
                id={inputId}
                value={String(values[field.key] ?? "")}
                placeholder={field.placeholder}
                onChange={(event) => setField(field.key, event.target.value)}
              />
            )}

            {field.type === "date" && (
              <Input
                id={inputId}
                type="date"
                value={String(values[field.key] ?? "")}
                onChange={(event) => setField(field.key, event.target.value)}
              />
            )}

            {field.type === "select" && (
              <Select
                value={String(values[field.key] ?? "")}
                onValueChange={(value) => setField(field.key, value)}
              >
                <SelectTrigger id={inputId}>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === "switch" && (
              <div className="flex items-center gap-2 pt-1">
                <Switch
                  id={inputId}
                  checked={!!values[field.key]}
                  onCheckedChange={(checked) => setField(field.key, checked)}
                />

                <span className="text-sm text-muted-foreground">
                  {values[field.key] ? "Yes" : "No"}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


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
 * ADD NEW BOX (dashed placeholder card)
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
 * Existing records render as boxes in a grid, with an
 * "Add New" box alongside them. If there are no records the
 * form opens right away. Clicking "Add New" swaps the grid
 * for the form inline (no sheet/drawer).
 * ========================================================= */

export function ModuleRecordsPanel({
  module,
  candidateId,
  tenantId,
  onClose,
  onSuccess,
}: {
  module: ModuleConfig
  candidateId: string
  tenantId: string | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [mode, setMode] = useState<PanelMode>("list")
  const [records, setRecords] = useState<ModuleRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)

  const [values, setValues] = useState<FieldValues>(module.defaultValues())
  const [saving, setSaving] = useState(false)

  const hasRecords = useMemo(() => records.length > 0, [records])

  useEffect(() => {
    let active = true

    async function load() {
      setLoadingRecords(true)
      const data = await fetchModuleRecords(module.key, candidateId)

      if (!active) return

      setRecords(data)
      setMode(data.length > 0 ? "list" : "form")
      setValues(module.defaultValues())
      setLoadingRecords(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [module, candidateId])

  function setField(key: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!tenantId) {
      toast.error(
        "Missing tenant information.",
        "Please refresh the page and try again.",
      )
      return
    }

    for (const field of module.fields) {
      const visible = field.showIf ? field.showIf(values) : true

      if (field.required && visible && !values[field.key]) {
        toast.error(
          `${field.label} is required.`,
          `Please fill in ${field.label.toLowerCase()} before saving.`,
        )
        return
      }
    }

    setSaving(true)

    try {
      const payload = module.buildPayload(values, candidateId, tenantId)

      const { error } = await supabase.from(module.table).insert(payload)

      if (error) throw error

      toast.success(
        `${module.title} record added.`,
        `A new ${module.title.toLowerCase()} record has been created for this candidate.`,
      )

      const refreshed = await fetchModuleRecords(module.key, candidateId)
      setRecords(refreshed)
      setMode("list")
      onSuccess()
    } catch (error) {
      console.error(error)

      toast.error(
        `Failed to add ${module.title.toLowerCase()} record.`,
        "Please try again.",
      )
    } finally {
      setSaving(false)
    }
  }

  function startAddNew() {
    setValues(module.defaultValues())
    setMode("form")
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">
          {mode === "list"
            ? `${module.title} Records`
            : `Add ${module.title} Record`}
        </p>

        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ===================== LIST MODE ===================== */}

      {mode === "list" && (
        <>
          {loadingRecords ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading records...
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {records.map((record) => (
                <RecordBox key={record.id} module={module} record={record} />
              ))}

              <AddNewBox onClick={startAddNew} />
            </div>
          )}
        </>
      )}

      {/* ===================== FORM MODE ===================== */}

      {mode === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <ModuleFormFields module={module} values={values} setField={setField} />

          <div className={cn("flex justify-end gap-2 pt-2")}>
            <Button
              type="button"
              variant="outline"
              onClick={() => (hasRecords ? setMode("list") : onClose())}
              disabled={saving}
            >
              {hasRecords ? (
                <>
                  <ArrowLeft />
                  Back
                </>
              ) : (
                "Cancel"
              )}
            </Button>

            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Add Record
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
