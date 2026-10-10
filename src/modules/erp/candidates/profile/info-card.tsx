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
    <div className="min-w-0 rounded-md border bg-muted/20 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-medium">
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
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">Candidate Information</CardTitle>
      </CardHeader>

      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <InfoItem label="Candidate Name" value={candidate.name} />

          <InfoItem label="Passport Number" value={candidate.passport_no} />

          <InfoItem label="Country" value={candidate.country ?? "—"} />

          <InfoItem
            label="Received Date"
            value={candidate.received_date ?? "—"}
            icon={<CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />}
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
              <Badge
                variant={candidate.is_returned ? "destructive" : "default"}
                className="px-2 py-0 text-[10px]"
              >
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