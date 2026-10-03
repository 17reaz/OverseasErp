import { Fragment, useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Loader2, ScrollText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import {
  AUDIT_PAGE_SIZE,
  getAuditLogs,
  type AuditFilters,
  type AuditLog,
} from "./audit-service"

const MODULE_LABELS: Record<string, string> = {
  candidates: "Candidates",
  agents: "Agents",
  agencies: "Agencies",
  medicals: "Medical",
  mofas: "MOFA",
  fingers: "Finger",
  police_clearances: "Police Clearance",
  trade_tests: "Takamul",
  visas: "Visa",
  bmet: "BMET",
  flights: "Flight",
  files: "Files",
  tasks: "Tasks",
  parties: "Parties",
  transactions: "Transactions",
  transaction_groups: "Transaction Groups",
  accounts: "Accounts",
  sales: "Sales",
  payroll: "Payroll",
  fixed_costs: "Fixed Costs",
  invoices: "Invoices",
  payables: "Payables",
  employees: "Employees",
  categories: "Categories",
  document_templates: "Document Templates",
  tenant_numbering_settings: "Numbering",
  tenant_members: "Team Members",
}

const HIDDEN_FIELDS = new Set([
  "id",
  "tenant_id",
  "created_at",
  "updated_at",
  "created_by",
])

const TONE_STYLES = {
  create:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  update:
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  delete: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  restore:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
} as const

const INITIAL_FILTERS: AuditFilters = {
  table: "all",
  action: "all",
  search: "",
  from: "",
  to: "",
}

function describe(log: AuditLog): {
  label: string
  tone: keyof typeof TONE_STYLES
} {
  if (log.action === "INSERT") return { label: "Created", tone: "create" }
  if (log.action === "DELETE") return { label: "Deleted", tone: "delete" }

  if (log.changed_fields?.includes("is_deleted")) {
    return log.new_data?.is_deleted === true
      ? { label: "Moved to trash", tone: "delete" }
      : { label: "Restored", tone: "restore" }
  }

  return { label: "Updated", tone: "update" }
}

function humanize(field: string) {
  const text = field.replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"

  const text = typeof value === "object" ? JSON.stringify(value) : String(value)
  return text.length > 120 ? `${text.slice(0, 120)}…` : text
}

function buildDetails(log: AuditLog) {
  if (log.action === "UPDATE") {
    return (log.changed_fields ?? []).map((field) => ({
      field,
      before: log.old_data?.[field],
      after: log.new_data?.[field],
    }))
  }

  const data = log.action === "INSERT" ? log.new_data : log.old_data

  return Object.entries(data ?? {})
    .filter(
      ([key, value]) =>
        !HIDDEN_FIELDS.has(key) && value !== null && value !== "",
    )
    .map(([field, value]) => ({
      field,
      before: log.action === "DELETE" ? value : undefined,
      after: log.action === "INSERT" ? value : undefined,
    }))
}

export function AuditSection() {
  const [filters, setFilters] = useState<AuditFilters>(INITIAL_FILTERS)
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(0)

  const [rows, setRows] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // debounce the search box
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) =>
        current.search === searchInput
          ? current
          : { ...current, search: searchInput },
      )
      setPage(0)
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    getAuditLogs(filters, page)
      .then((result) => {
        if (cancelled) return
        setRows(result.rows)
        setTotal(result.total)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load activity")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, page])

  function updateFilter(key: keyof AuditFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(0)
  }

  const firstItem = total === 0 ? 0 : page * AUDIT_PAGE_SIZE + 1
  const lastItem = Math.min((page + 1) * AUDIT_PAGE_SIZE, total)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="size-4" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Who changed what, and when. Entries cannot be edited or deleted.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Search record or user"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="lg:col-span-2"
          />

          <Select
            value={filters.table}
            onValueChange={(value) => updateFilter("table", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {Object.entries(MODULE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.action}
            onValueChange={(value) => updateFilter("action", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="INSERT">Created</SelectItem>
              <SelectItem value="UPDATE">Updated</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="date"
              aria-label="From date"
              value={filters.from}
              onChange={(event) => updateFilter("from", event.target.value)}
            />
            <Input
              type="date"
              aria-label="To date"
              value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>When</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Record</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-destructive"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No activity found.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                rows.map((log) => {
                  const action = describe(log)
                  const expanded = expandedId === log.id
                  const details = expanded ? buildDetails(log) : []

                  return (
                    <Fragment key={log.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpandedId(expanded ? null : log.id)}
                      >
                        <TableCell>
                          {expanded ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(log.created_at).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>

                        <TableCell>
                          <div className="text-sm font-medium">
                            {log.actor_name ?? "Unknown"}
                          </div>
                          {log.actor_role && (
                            <div className="text-xs text-muted-foreground">
                              {log.actor_role}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(TONE_STYLES[action.tone])}
                          >
                            {action.label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm font-medium">
                            {log.record_label ?? "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {MODULE_LABELS[log.table_name] ?? log.table_name}
                          </div>
                        </TableCell>
                      </TableRow>

                      {expanded && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell />
                          <TableCell colSpan={4} className="py-3">
                            {details.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No field details recorded.
                              </p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs text-muted-foreground">
                                      <th className="pb-1 pr-4 font-medium">Field</th>
                                      <th className="pb-1 pr-4 font-medium">Before</th>
                                      <th className="pb-1 font-medium">After</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {details.map((detail) => (
                                      <tr key={detail.field} className="align-top">
                                        <td className="py-1 pr-4 font-medium">
                                          {humanize(detail.field)}
                                        </td>
                                        <td className="py-1 pr-4 text-muted-foreground">
                                          {formatValue(detail.before)}
                                        </td>
                                        <td className="py-1">
                                          {formatValue(detail.after)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total > 0 ? `Showing ${firstItem}–${lastItem} of ${total}` : ""}
        </span>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={lastItem >= total || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}