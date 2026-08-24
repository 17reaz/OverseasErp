import { useState } from "react"
import { Download, FileText, Loader2, Printer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"


import type {
  ReportColumn,
  ReportConfig,
  ReportRow,
} from "./report-types"

type ReportPreviewProps = {
  config: ReportConfig
  rows: ReportRow[]
}

const columnLabels: Record<string, string> = {
  sl: "SL",
  name: "Candidate",
  passport_no: "Passport",
  country: "Country",
  agent: "Agent",
  stage: "Stage",
  status: "Status",
  received_date: "Received Date",

  candidate: "Candidate",
  medical_date: "Medical Date",
  fit_date: "Fit Date",

  mofa_date: "MOFA Date",

  visa_date: "Visa Date",

  flight_date: "Flight Date",
  airline: "Airline",
}

function getColumnValue(
  row: ReportRow,
  column: string,
) {
  switch (column) {
    case "sl":
      return row.sl ?? "—"

    case "name":
    case "candidate":
      return row.name ?? "—"

    case "passport_no":
      return row.passport_no ?? "—"

    case "country":
      return row.country ?? "—"

    case "agent":
      return row.agent ?? "—"

    case "stage":
      return row.stage ?? "—"

    case "status":
      return row.status ?? "—"

    case "received_date":
    case "medical_date":
    case "fit_date":
    case "mofa_date":
    case "visa_date":
    case "flight_date":
      return (
        row[
          column as keyof ReportRow
        ] ?? "—"
      )

    case "airline":
      return row.airline ?? "—"

    default:
      return "—"
  }
}

function renderValue(
  row: ReportRow,
  column: string,
) {
  const value = getColumnValue(
    row,
    column,
  )

  if (column === "status") {
    const status = String(value)

    if (status === "Returned") {
      return (
        <Badge variant="destructive">
          Returned
        </Badge>
      )
    }

    if (status === "Active") {
      return (
        <Badge>
          Active
        </Badge>
      )
    }

    return (
      <Badge variant="outline">
        {status}
      </Badge>
    )
  }

  return value
}

function createFileName(
  config: ReportConfig,
) {
  const reportName =
    config.name.trim() ||
    "OverseasErp-Report"

  return (
    reportName
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase() + ".pdf"
  )
}

export function ReportPreview({
  config,
  rows,
}: ReportPreviewProps) {
  const [isGenerating, setIsGenerating] =
    useState(false)

  const columns: ReportColumn[] =
    config.columns.map((id) => ({
      id,
      label:
        columnLabels[id] ?? id,
    }))

  const generatePdf = async () => {
  if (columns.length === 0) {
    return null
  }

  setIsGenerating(true)

  try {
    const [{ pdf }, { ReportDocument }] =
      await Promise.all([
        import("@react-pdf/renderer"),
        import("./pdf/report-document"),
      ])

    const blob = await pdf(
      <ReportDocument
        config={config}
        rows={rows}
      />,
    ).toBlob()

    return blob
  } finally {
    setIsGenerating(false)
  }
}

  const handleDownload = async () => {
    const blob = await generatePdf()

    if (!blob) {
      return
    }

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement("a")

    link.href = url
    link.download =
      createFileName(config)

    document.body.appendChild(link)

    link.click()

    link.remove()

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }

  const handlePrint = async () => {
    const blob = await generatePdf()

    if (!blob) {
      return
    }

    const url =
      URL.createObjectURL(blob)

    const printWindow =
      window.open(
        url,
        "_blank",
        "noopener,noreferrer",
      )

    if (!printWindow) {
      URL.revokeObjectURL(url)

      return
    }

    /*
     * Keep the Blob URL alive while the
     * new browser tab is using the PDF.
     */
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 60000)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}

      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            Report Preview
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Review the report before exporting
            it as PDF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              isGenerating ||
              columns.length === 0
            }
            onClick={handlePrint}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Printer className="mr-2 size-4" />
            )}

            Print
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={
              isGenerating ||
              columns.length === 0
            }
            onClick={handleDownload}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}

            Download PDF
          </Button>

          <Badge variant="outline">
            {config.type}
          </Badge>
        </div>
      </div>

      {/* Preview */}

      <div className="min-h-0 flex-1 overflow-auto py-6">
        <div className="mx-auto max-w-[1100px] rounded-lg border bg-background shadow-sm">

          {/* Document Header */}

          <div className="border-b p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-2xl font-semibold">
                  {config.name ||
                    "Untitled Report"}
                </h1>

                <div className="mt-2 text-sm text-muted-foreground">
                  {config.dateFrom &&
                  config.dateTo
                    ? `${config.dateFrom} → ${config.dateTo}`
                    : "All dates"}
                </div>
              </div>

              <FileText className="size-6 text-muted-foreground" />
            </div>
          </div>

          {/* Table */}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {columns.map(
                    (column) => (
                      <th
                        key={column.id}
                        className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium"
                      >
                        {column.label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(
                        columns.length,
                        1,
                      )}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      No records found for
                      this report.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0"
                    >
                      {columns.map(
                        (column) => (
                          <td
                            key={column.id}
                            className="whitespace-nowrap px-4 py-3"
                          >
                            {renderValue(
                              row,
                              column.id,
                            )}
                          </td>
                        ),
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}

          <div className="flex items-center justify-between border-t px-8 py-4 text-xs text-muted-foreground">
            <span>
              {rows.length} record
              {rows.length === 1
                ? ""
                : "s"}
            </span>

            <span>
              Generated from OverseasErp
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}