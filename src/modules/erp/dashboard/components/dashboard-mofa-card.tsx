import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

interface DashboardMofaCardProps {
  total: number;
  pending: number;
  approved: number;
  onClick?: () => void;
}

export function DashboardMofaCard({
  total,
  pending,
  approved,
  onClick,
}: DashboardMofaCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md border bg-muted/40">
            <FileText className="size-4" />
          </div>

          <CardTitle className="text-sm font-medium">
            MOFA
          </CardTitle>
        </div>

        <ArrowRight className="size-4 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-semibold">
          {total}
        </div>

        <p className="text-xs text-muted-foreground">
          Total applications
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
            {approved} Approved
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}