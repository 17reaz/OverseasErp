import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

interface DashboardVisaCardProps {
  total: number;
  pending: number;
  issued: number;
  onClick?: () => void;
}

export function DashboardVisaCard({
  total,
  pending,
  issued,
  onClick,
}: DashboardVisaCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md border bg-muted/40">
            <FileCheck2 className="size-4" />
          </div>

          <CardTitle className="text-sm font-medium">
            Visa
          </CardTitle>
        </div>

        <ArrowRight className="size-4 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-semibold">
          {total}
        </div>

        <p className="text-xs text-muted-foreground">
          Total visa records
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="gap-1"
          >
            <Clock3 className="size-3" />
            {pending} Pending
          </Badge>

          <Badge
            variant="secondary"
            className="gap-1"
          >
            <CheckCircle2 className="size-3" />
            {issued} Issued
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}