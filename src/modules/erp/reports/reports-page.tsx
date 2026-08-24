import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { Loader2 } from "lucide-react"

import { ReportBuilder } from "./report-builder"
import { ReportPreview } from "./report-preview"

import type {
  ReportConfig,
  ReportRow,
} from "./report-types"

import { supabase } from "@/lib/supabase/client"

const initialConfig: ReportConfig = {
  name: "",
  type: "candidates",

  columns: [
    "sl",
    "name",
    "passport_no",
    "country",
    "agent",
    "stage",
    "status",
    "received_date",
  ],

  filters: {
    status: "all",
  },
}

function filterRows(
  rows: ReportRow[],
  config: ReportConfig,
) {
  return rows.filter((row) => {
    const {
      agentId,
      country,
      stage,
      status,
    } = config.filters

    if (
      agentId &&
      row.agent !== agentId
    ) {
      return false
    }

    if (
      country &&
      row.country !== country
    ) {
      return false
    }

    if (
      stage &&
      row.stage !== stage
    ) {
      return false
    }

    if (
      status === "active" &&
      row.status !== "Active"
    ) {
      return false
    }

    if (
      status === "returned" &&
      row.status !== "Returned"
    ) {
      return false
    }

    if (
      config.dateFrom &&
      row.received_date &&
      row.received_date <
        config.dateFrom
    ) {
      return false
    }

    if (
      config.dateTo &&
      row.received_date &&
      row.received_date >
        config.dateTo
    ) {
      return false
    }

    return true
  })
}

export function ReportsPage() {
  const [config, setConfig] =
    useState<ReportConfig>(
      initialConfig,
    )

  const [rows, setRows] =
    useState<ReportRow[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const loadCandidates = async () => {
    try {
      setError(null)

      const {
        data,
        error,
      } = await supabase
        .from("candidates")
        .select(
          `
            id,
            sl,
            name,
            passport_no,
            country,
            current_stage,
            is_returned,
            received_date,
            agent_id,
            agents (
              name
            )
          `,
        )
        .eq(
          "is_deleted",
          false,
        )
        .order(
          "sl",
          {
            ascending: true,
            nullsFirst: false,
          },
        )

      if (error) {
        throw error
      }

      const mappedRows: ReportRow[] =
        (data ?? []).map(
          (candidate) => {
            const agentData =
              Array.isArray(
                candidate.agents,
              )
                ? candidate.agents[0]
                : candidate.agents

            return {
              id: candidate.id,

              sl: candidate.sl,

              name:
                candidate.name,

              passport_no:
                candidate.passport_no,

              country:
                candidate.country,

              agent:
                agentData?.name ??
                null,

              stage:
                candidate.current_stage,

              status:
                candidate.is_returned
                  ? "Returned"
                  : "Active",

              received_date:
                candidate.received_date,
            }
          },
        )

      setRows(mappedRows)
    } catch (err) {
      console.error(
        "Failed to load report data:",
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load report data",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCandidates()

    const channel =
      supabase
        .channel(
          "reports-candidates-realtime",
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "candidates",
          },
          () => {
            loadCandidates()
          },
        )
        .subscribe()

    return () => {
      supabase.removeChannel(
        channel,
      )
    }
  }, [])

  const filteredRows = useMemo(
    () =>
      filterRows(
        rows,
        config,
      ),
    [rows, config],
  )

  return (
    <div className="flex h-full min-h-0 w-full gap-5 overflow-hidden">
      {/* Report Builder */}

      <section
        className="
          flex
          w-[380px]
          shrink-0
          min-h-0
          flex-col
          overflow-hidden
          rounded-lg
          border
          bg-background
        "
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <ReportBuilder
            onChange={setConfig}
          />
        </div>
      </section>

      {/* Report Preview */}

      <section
        className="
          flex
          min-w-0
          min-h-0
          flex-1
          flex-col
          overflow-hidden
          rounded-lg
          border
          bg-background
        "
      >
        <div className="min-h-0 flex-1 overflow-hidden p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />

                Loading report data...
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
                <p className="text-sm font-medium text-destructive">
                  Failed to load report
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <ReportPreview
              config={config}
              rows={filteredRows}
            />
          )}
        </div>
      </section>
    </div>
  )
}