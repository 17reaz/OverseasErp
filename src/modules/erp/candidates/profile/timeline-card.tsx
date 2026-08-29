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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Timeline
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Every record added for this candidate, across all modules, newest
          first.
        </p>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loading timeline...
          </p>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No records yet for this candidate.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {entries.map((entry, index) => {
                  const config = getStatusConfig(entry.status)

                  return (
                    <TableRow key={`${entry.moduleKey}-${index}`}>
                      <TableCell className="flex items-center gap-2 font-medium">
                        {entry.icon}
                        {entry.moduleTitle}
                      </TableCell>

                      <TableCell>{entry.date ?? "—"}</TableCell>

                      <TableCell>
                        <Badge variant={config.variant} className="text-xs">
                          {config.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
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
