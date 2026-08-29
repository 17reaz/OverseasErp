import type { ReactNode } from "react"

import { CalendarDays } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { Candidate } from "../candidate-service"


/* =========================================================
 * INFORMATION ITEM
 * ========================================================= */

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="rounded-md border bg-muted/20 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1.5 flex items-center gap-2 text-sm font-medium">
        {icon}
        {value}
      </p>
    </div>
  )
}


/* =========================================================
 * CANDIDATE INFORMATION CARD
 * ========================================================= */

export function CandidateInfoCard({ candidate }: { candidate: Candidate }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Information</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="Candidate Name" value={candidate.name} />

          <InfoItem label="Passport Number" value={candidate.passport_no} />

          <InfoItem label="Country" value={candidate.country ?? "—"} />

          <InfoItem
            label="Received Date"
            value={candidate.received_date ?? "—"}
            icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
          />

          <InfoItem label="Candidate SL" value={candidate.sl ?? "—"} />

          <InfoItem
            label="Current Stage"
            value={candidate.current_stage ?? "Pending"}
          />

          <InfoItem label="Agent" value={candidate.agent?.name ?? "—"} />

          <InfoItem
            label="Status"
            value={
              <Badge variant={candidate.is_returned ? "destructive" : "default"}>
                {candidate.is_returned ? "Returned" : "Active"}
              </Badge>
            }
          />

          {candidate.is_returned && (
            <InfoItem
              label="Returned Date"
              value={candidate.returned_date ?? "—"}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
