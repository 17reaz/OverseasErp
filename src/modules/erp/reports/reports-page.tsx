import { useMemo, useState } from "react"

import { ReportBuilder } from "./report-builder"
import { ReportPreview } from "./report-preview"

import type {
  ReportConfig,
  ReportRow,
} from "./report-types"

const demoRows: ReportRow[] = [
  {
    id: "1",
    sl: 1,
    name: "Rahim Ahmed",
    passport_no: "AB123456",
    country: "Saudi Arabia",
    agent: "Agent 01",
    stage: "Medical",
    status: "Active",
    received_date: "2026-08-01",
  },
  {
    id: "2",
    sl: 2,
    name: "Karim Hasan",
    passport_no: "CD789012",
    country: "UAE",
    agent: "Agent 02",
    stage: "MOFA",
    status: "Active",
    received_date: "2026-08-03",
  },
  {
    id: "3",
    sl: 3,
    name: "Hasan Ali",
    passport_no: "EF345678",
    country: "Qatar",
    agent: "Agent 01",
    stage: "Visa",
    status: "Returned",
    received_date: "2026-08-05",
  },
]

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

  const filteredRows = useMemo(
    () =>
      filterRows(
        demoRows,
        config,
      ),
    [config],
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
          <ReportPreview
            config={config}
            rows={filteredRows}
          />
        </div>
      </section>
    </div>
  )
}