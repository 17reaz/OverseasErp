import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import type {
  ReportColumn,
  ReportConfig,
  ReportFilters,
  ReportType,
} from "./report-types"

const reportColumns: Record<ReportType, ReportColumn[]> = {
  candidates: [
    {
      id: "sl",
      label: "SL",
    },
    {
      id: "name",
      label: "Candidate",
    },
    {
      id: "passport_no",
      label: "Passport",
    },
    {
      id: "country",
      label: "Country",
    },
    {
      id: "agent",
      label: "Agent",
    },
    {
      id: "stage",
      label: "Stage",
    },
    {
      id: "status",
      label: "Status",
    },
    {
      id: "received_date",
      label: "Received Date",
    },
  ],

  medical: [
    {
      id: "candidate",
      label: "Candidate",
    },
    {
      id: "passport_no",
      label: "Passport",
    },
    {
      id: "medical_date",
      label: "Medical Date",
    },
    {
      id: "fit_date",
      label: "Fit Date",
    },
    {
      id: "status",
      label: "Status",
    },
  ],

  mofa: [
    {
      id: "candidate",
      label: "Candidate",
    },
    {
      id: "passport_no",
      label: "Passport",
    },
    {
      id: "mofa_date",
      label: "MOFA Date",
    },
    {
      id: "status",
      label: "Status",
    },
  ],

  visa: [
    {
      id: "candidate",
      label: "Candidate",
    },
    {
      id: "passport_no",
      label: "Passport",
    },
    {
      id: "visa_date",
      label: "Visa Date",
    },
    {
      id: "status",
      label: "Status",
    },
  ],

  flight: [
    {
      id: "candidate",
      label: "Candidate",
    },
    {
      id: "passport_no",
      label: "Passport",
    },
    {
      id: "flight_date",
      label: "Flight Date",
    },
    {
      id: "airline",
      label: "Airline",
    },
    {
      id: "status",
      label: "Status",
    },
  ],
}

const defaultColumns: Record<
  ReportType,
  string[]
> = {
  candidates: [
    "sl",
    "name",
    "passport_no",
    "country",
    "agent",
    "stage",
    "status",
    "received_date",
  ],

  medical: [
    "candidate",
    "passport_no",
    "medical_date",
    "fit_date",
    "status",
  ],

  mofa: [
    "candidate",
    "passport_no",
    "mofa_date",
    "status",
  ],

  visa: [
    "candidate",
    "passport_no",
    "visa_date",
    "status",
  ],

  flight: [
    "candidate",
    "passport_no",
    "flight_date",
    "airline",
    "status",
  ],
}

const defaultFilters: ReportFilters = {
  agentId: undefined,
  country: undefined,
  stage: undefined,
  status: "all",
}

type ReportBuilderProps = {
  onChange: (config: ReportConfig) => void
}

export function ReportBuilder({
  onChange,
}: ReportBuilderProps) {
  const [name, setName] = useState("")

  const [type, setType] =
    useState<ReportType>("candidates")

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [columns, setColumns] =
    useState<string[]>(
      defaultColumns.candidates,
    )

  const [filters, setFilters] =
    useState<ReportFilters>(
      defaultFilters,
    )

  const availableColumns =
    reportColumns[type]

  const emit = (
    overrides: Partial<ReportConfig> = {},
  ) => {
    onChange({
      name,
      type,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      columns,
      filters,
      ...overrides,
    })
  }

  const handleNameChange = (
    value: string,
  ) => {
    setName(value)

    emit({
      name: value,
    })
  }

  const handleTypeChange = (
    value: ReportType,
  ) => {
    const nextColumns =
      defaultColumns[value]

    const nextFilters: ReportFilters = {
      ...defaultFilters,
    }

    setType(value)
    setColumns(nextColumns)
    setFilters(nextFilters)

    emit({
      type: value,
      columns: nextColumns,
      filters: nextFilters,
    })
  }

  const handleDateFromChange = (
    value: string,
  ) => {
    setDateFrom(value)

    emit({
      dateFrom: value || undefined,
    })
  }

  const handleDateToChange = (
    value: string,
  ) => {
    setDateTo(value)

    emit({
      dateTo: value || undefined,
    })
  }

  const handleFilterChange = (
    key: keyof ReportFilters,
    value: string,
  ) => {
    const nextFilters: ReportFilters = {
      ...filters,
      [key]:
        value === "all"
          ? undefined
          : value,
    }

    if (key === "status") {
      nextFilters.status =
        value as ReportFilters["status"]
    }

    setFilters(nextFilters)

    emit({
      filters: nextFilters,
    })
  }

  const toggleColumn = (
    columnId: string,
  ) => {
    const nextColumns =
      columns.includes(columnId)
        ? columns.filter(
            (id) => id !== columnId,
          )
        : [...columns, columnId]

    setColumns(nextColumns)

    emit({
      columns: nextColumns,
    })
  }

  const reset = () => {
    const nextType: ReportType =
      "candidates"

    const nextColumns =
      defaultColumns[nextType]

    const nextFilters = {
      ...defaultFilters,
    }

    setName("")
    setType(nextType)
    setDateFrom("")
    setDateTo("")
    setColumns(nextColumns)
    setFilters(nextFilters)

    onChange({
      name: "",
      type: nextType,
      dateFrom: undefined,
      dateTo: undefined,
      columns: nextColumns,
      filters: nextFilters,
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}

      <div className="shrink-0">
        <h2 className="text-lg font-semibold">
          Report Builder
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Configure the report you want to
          generate.
        </p>
      </div>

      <Separator className="my-5" />

      {/* Content */}

      <ScrollArea className="min-h-0 flex-1 pr-4">
        <div className="space-y-7">

          {/* Report Information */}

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">
                Report Information
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Basic report information.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-name">
                Report Name
              </Label>

              <Input
                id="report-name"
                placeholder="Monthly Candidate Report"
                value={name}
                onChange={(event) =>
                  handleNameChange(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Report Type</Label>

              <Select
                value={type}
                onValueChange={(value) =>
                  handleTypeChange(
                    value as ReportType,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="candidates">
                    Candidates
                  </SelectItem>

                  <SelectItem value="medical">
                    Medical
                  </SelectItem>

                  <SelectItem value="mofa">
                    MOFA
                  </SelectItem>

                  <SelectItem value="visa">
                    Visa
                  </SelectItem>

                  <SelectItem value="flight">
                    Flight
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* Date Range */}

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">
                Date Range
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Filter records by date.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date-from">
                  From
                </Label>

                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) =>
                    handleDateFromChange(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to">
                  To
                </Label>

                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) =>
                    handleDateToChange(
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Filters */}

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">
                Filters
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Choose which records should be
                included.
              </p>
            </div>

            {/* Agent */}

            <div className="space-y-2">
              <Label>Agent</Label>

              <Select
                value={
                  filters.agentId ?? "all"
                }
                onValueChange={(value) =>
                  handleFilterChange(
                    "agentId",
                    value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All Agents
                  </SelectItem>

                  <SelectItem value="agent-1">
                    Agent 01
                  </SelectItem>

                  <SelectItem value="agent-2">
                    Agent 02
                  </SelectItem>

                  <SelectItem value="agent-3">
                    Agent 03
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Country */}

            <div className="space-y-2">
              <Label>Country</Label>

              <Select
                value={
                  filters.country ?? "all"
                }
                onValueChange={(value) =>
                  handleFilterChange(
                    "country",
                    value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All Countries
                  </SelectItem>

                  <SelectItem value="Saudi Arabia">
                    Saudi Arabia
                  </SelectItem>

                  <SelectItem value="UAE">
                    UAE
                  </SelectItem>

                  <SelectItem value="Qatar">
                    Qatar
                  </SelectItem>

                  <SelectItem value="Oman">
                    Oman
                  </SelectItem>

                  <SelectItem value="Kuwait">
                    Kuwait
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stage */}

            <div className="space-y-2">
              <Label>Stage</Label>

              <Select
                value={
                  filters.stage ?? "all"
                }
                onValueChange={(value) =>
                  handleFilterChange(
                    "stage",
                    value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All Stages
                  </SelectItem>

                  <SelectItem value="medical">
                    Medical
                  </SelectItem>

                  <SelectItem value="mofa">
                    MOFA
                  </SelectItem>

                  <SelectItem value="visa">
                    Visa
                  </SelectItem>

                  <SelectItem value="flight">
                    Flight
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}

            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={
                  filters.status ?? "all"
                }
                onValueChange={(value) =>
                  handleFilterChange(
                    "status",
                    value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All Status
                  </SelectItem>

                  <SelectItem value="active">
                    Active
                  </SelectItem>

                  <SelectItem value="returned">
                    Returned
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* Columns */}

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">
                Columns
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Select the fields that should
                appear.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                <span className="text-xs font-medium">
                  Available Columns
                </span>

                <span className="text-xs text-muted-foreground">
                  {columns.length} selected
                </span>
              </div>

              <div className="space-y-3 p-4">
                {availableColumns.map(
                  (column) => (
                    <div
                      key={column.id}
                      className="flex items-center gap-3"
                    >
                      <Checkbox
                        id={`column-${column.id}`}
                        checked={columns.includes(
                          column.id,
                        )}
                        onCheckedChange={() =>
                          toggleColumn(
                            column.id,
                          )
                        }
                      />

                      <Label
                        htmlFor={`column-${column.id}`}
                        className="cursor-pointer font-normal"
                      >
                        {column.label}
                      </Label>
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Footer */}

      <Separator className="my-4" />

      <div className="flex shrink-0 justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={reset}
        >
          Reset
        </Button>

        <Button
          type="button"
          disabled={columns.length === 0}
        >
          Preview
        </Button>
      </div>
    </div>
  )
}