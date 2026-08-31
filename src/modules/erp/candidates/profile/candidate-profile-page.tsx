import { useCallback, useEffect, useState } from "react"

import { Link, useParams } from "react-router-dom"

import { ArrowLeft, Pencil } from "lucide-react"

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

import { useAuth } from "@/modules/auth/components/auth-provider"

import { CandidateFormDialog } from "../components/candidate-form-dialog"
import { getCandidate, type Candidate } from "../candidate-service"

import { CandidateInfoCard } from "./info-card"
import { CandidateQrCard } from "./qr-card"
import { CandidateTimelineCard } from "./timeline-card"
import { ModuleRecordsSheet } from "./module-records-sheet"
import { MODULES } from "./module-configs"
import { ProcessingStepper } from "./processing-stepper"
import {
  fetchDocumentsStatus,
  fetchModuleStatuses,
  refreshModuleStatus,
} from "./status-service"
import type { ModuleStatus } from "./types"


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

  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(null)
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

  async function handleModuleSuccess(moduleKey: string) {
    if (!candidateId) return

    const status = await refreshModuleStatus(moduleKey, candidateId)

    if (status) {
      setModuleStatuses((prev) => ({ ...prev, [moduleKey]: status }))
    }
  }


  /* =======================================================
   * LOADING
   * ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading candidate...</p>
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

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error ?? "Candidate not found."}
        </div>
      </div>
    )
  }


  /* =======================================================
   * PAGE
   * ======================================================= */

  const activeModule = MODULES.find((m) => m.key === activeModuleKey) ?? null

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

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {candidate.name}
              </h1>

              <Badge variant={candidate.is_returned ? "destructive" : "default"}>
                {candidate.is_returned ? "Returned" : "Active"}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Passport: {candidate.passport_no}
            </p>
          </div>
        </div>

        <Button onClick={() => setEditOpen(true)}>
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

        <CardContent className="pt-6">
          <ProcessingStepper
            moduleStatuses={moduleStatuses}
            documentsStatus={documentsStatus}
            candidateId={candidate.id}
            onOpenModule={(moduleKey) => setActiveModuleKey(moduleKey)}
          />
        </CardContent>
      </Card>

      {/* MODULE RECORDS SHEET (shared across every module) */}

      {activeModule && (
        <ModuleRecordsSheet
          module={activeModule}
          candidateId={candidate.id}
          tenantId={profile?.tenant_id ?? null}
          open={!!activeModuleKey}
          onOpenChange={(open) => {
            if (!open) setActiveModuleKey(null)
          }}
          onSuccess={() => {
            void handleModuleSuccess(activeModule.key)
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
