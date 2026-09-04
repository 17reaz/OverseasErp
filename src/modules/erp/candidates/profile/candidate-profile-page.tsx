import { useCallback, useEffect, useState } from "react"

import { Link, useParams } from "react-router-dom"

import { AlertCircle, ArrowLeft, Pencil } from "lucide-react"

import { toast } from "@/components/shared/toast/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import { useAuth } from "@/modules/auth/components/auth-provider"

import { CandidateFormDialog } from "../components/candidate-form-dialog"
import { getCandidate, type Candidate } from "../candidate-service"

import { CandidateInfoCard } from "./info-card"
import { CandidateQrCard } from "./qr-card"
import { CandidateTimelineCard } from "./timeline-card"
import { ModuleRecordsPanel } from "./module-records-panel"
import { ModuleRecordsSheet } from "./module-records-sheet"
import { MODULES } from "./module-configs"
import { ProcessingStepper } from "./processing-stepper"
import {
  fetchDocumentsStatus,
  fetchModuleStatuses,
  refreshModuleStatus,
} from "./status-service"
import type { ModuleStatus } from "./types"


/** Turns "Md. Kamal Hossain" into "MK" for the avatar chip. */
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}


export function CandidateProfilePage() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const { profile } = useAuth()

  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [moduleStatuses, setModuleStatuses] = useState<
    Record<string, ModuleStatus>
  >({})

  const [documentsStatus, setDocumentsStatus] =
    useState<ModuleStatus>("not_started")

  /** Which module's panel is expanded below the stepper. */
  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(null)

  /** Which module's "Add New" sheet is open. */
  const [addModuleKey, setAddModuleKey] = useState<string | null>(null)

  /** Bumped per-module to force the panel to refetch after a save. */
  const [panelRefreshTokens, setPanelRefreshTokens] = useState<
    Record<string, number>
  >({})

  const [editOpen, setEditOpen] = useState(false)


  /* =======================================================
   * LOAD CANDIDATE + MODULE STATUSES
   * ======================================================= */

  const loadCandidate = useCallback(async () => {
    if (!candidateId) {
      const message = "Candidate ID is missing."

      setError(message)
      setLoading(false)

      toast.error(
        "Candidate ID is missing.",
        "Please return to the Candidates page and select a candidate.",
      )

      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await getCandidate(candidateId)

      if (error) throw error

      if (!data) {
        const message = "Candidate not found."

        setError(message)

        toast.error(
          "Candidate not found.",
          "The requested candidate profile could not be found.",
        )

        return
      }

      setCandidate(data)

      const [statuses, docsStatus] = await Promise.all([
        fetchModuleStatuses(candidateId),
        fetchDocumentsStatus(candidateId),
      ])

      setModuleStatuses(statuses)
      setDocumentsStatus(docsStatus)
    } catch (error) {
      console.error(error)

      const message = "Failed to load candidate profile."

      setError(message)

      toast.error("Failed to load candidate profile.", "Please try again.")
    } finally {
      setLoading(false)
    }
  }, [candidateId])

  useEffect(() => {
    void loadCandidate()
  }, [loadCandidate])

  function handleOpenModule(moduleKey: string) {
    setActiveModuleKey((prev) => (prev === moduleKey ? null : moduleKey))
  }

  async function handleModuleSaved(moduleKey: string) {
    if (!candidateId) return

    const status = await refreshModuleStatus(moduleKey, candidateId)

    if (status) {
      setModuleStatuses((prev) => ({ ...prev, [moduleKey]: status }))
    }

    // Force the panel for this module to refetch and show the new box.
    setPanelRefreshTokens((prev) => ({
      ...prev,
      [moduleKey]: (prev[moduleKey] ?? 0) + 1,
    }))
  }


  /* =======================================================
   * LOADING — skeleton that mirrors the real layout
   * ======================================================= */

  if (loading) {
    return (
      <div className="space-y-6 pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>

        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }


  /* =======================================================
   * ERROR
   * ======================================================= */

  if (error || !candidate) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/app/candidates">
            <ArrowLeft />
            Back to Candidates
          </Link>
        </Button>

        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />

          <div className="space-y-1">
            <p className="font-medium text-destructive">
              {error ?? "Candidate not found."}
            </p>
            <p className="text-sm text-muted-foreground">
              Try going back and selecting the candidate again.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => void loadCandidate()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }


  /* =======================================================
   * PAGE
   * ======================================================= */

  const activeModule = MODULES.find((m) => m.key === activeModuleKey) ?? null
  const addModule = MODULES.find((m) => m.key === addModuleKey) ?? null

  return (
    <div className="min-h-0 space-y-6 pb-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/app/candidates">
              <ArrowLeft />
            </Link>
          </Button>

          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            aria-hidden="true"
          >
            {getInitials(candidate.name)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {candidate.name}
              </h1>

              <Badge
                variant={candidate.is_returned ? "destructive" : "default"}
                className="gap-1.5"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    candidate.is_returned ? "bg-destructive-foreground" : "bg-primary-foreground"
                  }`}
                  aria-hidden="true"
                />
                {candidate.is_returned ? "Returned" : "Active"}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Passport {candidate.passport_no}
            </p>
          </div>
        </div>

        <Button onClick={() => setEditOpen(true)} className="shrink-0">
          <Pencil />
          Edit Candidate
        </Button>
      </div>

      {/* OVERVIEW: INFO + QR */}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <CandidateInfoCard candidate={candidate} />
        <CandidateQrCard candidateId={candidate.id} />
      </div>

      {/* TIMELINE (table) */}

      <CandidateTimelineCard candidateId={candidate.id} />

      {/* PROCESSING MODULES — clickable stepper */}

      <Card>
        <CardHeader>
          <CardTitle>Processing Modules</CardTitle>

          <p className="text-sm text-muted-foreground">
            Tap a step to view its existing records or add a new one.
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-4 pt-6">
          <ProcessingStepper
            moduleStatuses={moduleStatuses}
            documentsStatus={documentsStatus}
            candidateId={candidate.id}
            onOpenModule={handleOpenModule}
          />

          {/* INLINE RECORDS PANEL — box view under the stepper */}

          {activeModule && (
            <div
              key={`${activeModule.key}-${panelRefreshTokens[activeModule.key] ?? 0}`}
              className="animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <ModuleRecordsPanel
                module={activeModule}
                candidateId={candidate.id}
                onClose={() => setActiveModuleKey(null)}
                onAddNew={() => setAddModuleKey(activeModule.key)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD NEW RECORD SHEET — opens directly in form mode */}

      {addModule && (
        <ModuleRecordsSheet
          module={addModule}
          candidateId={candidate.id}
          tenantId={profile?.tenant_id ?? null}
          open={!!addModuleKey}
          initialMode="form"
          onOpenChange={(open) => {
            if (!open) setAddModuleKey(null)
          }}
          onSuccess={() => {
            void handleModuleSaved(addModule.key)
          }}
        />
      )}

      {/* EDIT CANDIDATE */}

      <CandidateFormDialog
        open={editOpen}
        candidate={candidate}
        onOpenChange={setEditOpen}
        onSuccess={(updated) => {
          setCandidate(updated)
        }}
      />
    </div>
  )
}
