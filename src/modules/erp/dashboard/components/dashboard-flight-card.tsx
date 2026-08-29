import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Plane,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

interface DashboardFlightCardProps {
  total: number;
  scheduled: number;
  departed: number;
  onClick?: () => void;
}

export function DashboardFlightCard({
  total,
  scheduled,
  departed,
  onClick,
}: DashboardFlightCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md border bg-muted/40">
            <Plane className="size-4" />
          </div>

          <CardTitle className="text-sm font-medium">
            Flight
          </CardTitle>
        </div>

        <ArrowRight className="size-4 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-semibold">
          {total}
        </div>

        <p className="text-xs text-muted-foreground">
          Total flight records
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="gap-1"
          >
            <CalendarClock className="size-3" />
            {scheduled} Scheduled
          </Badge>

          <Badge
            variant="secondary"
            className="gap-1"
          >
            <CheckCircle2 className="size-3" />
            {departed} Departed
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}