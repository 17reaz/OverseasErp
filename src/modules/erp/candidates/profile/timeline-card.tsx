import { useEffect, useState } from "react"

import { History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { getStatusConfig } from "./module-configs"
import { fetchTimeline } from "./status-service"
import type { TimelineEntry } from "./types"


export function CandidateTimelineCard({
  candidateId,
}: {
  candidateId: string
}) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      const data = await fetchTimeline(candidateId)
      if (active) {
        setEntries(data)
        setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [candidateId])

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Timeline
        </CardTitle>

        <p className="text-xs text-muted-foreground">
          All records across modules, newest first.
        </p>
      </CardHeader>

      <CardContent className="px-4">
        {loading ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Loading timeline...
          </p>
        ) : entries.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No records yet for this candidate.
          </p>
        ) : (
          <div className="max-h-72 overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                <TableRow className="h-8">
                  <TableHead className="h-8 px-3 text-xs">Module</TableHead>
                  <TableHead className="h-8 px-3 text-xs">Date</TableHead>
                  <TableHead className="h-8 px-3 text-xs">Status</TableHead>
                  <TableHead className="h-8 px-3 text-xs">Details</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {entries.map((entry, index) => {
                  const config = getStatusConfig(entry.status)

                  return (
                    <TableRow key={`${entry.moduleKey}-${index}`}>
                      <TableCell className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium">
                        {entry.icon}
                        {entry.moduleTitle}
                      </TableCell>

                      <TableCell className="px-3 py-1.5 text-xs">
                        {entry.date ?? "—"}
                      </TableCell>

                      <TableCell className="px-3 py-1.5">
                        <Badge
                          variant={config.variant}
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {config.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-3 py-1.5 text-xs text-muted-foreground">
                        {entry.details}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}