import {
  Activity,
  CheckCircle2,
  RotateCcw,
  Users,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  DashboardData,
} from "../dashboard-service";

interface DashboardStatsProps {
  stats: DashboardData["stats"];
}

export function DashboardStats({
  stats,
}: DashboardStatsProps) {
  const items = [
    {
      title: "Total",
      value: stats.totalCandidates,
      icon: Users,
      description: "All candidates",
    },

    {
      title: "Active",
      value: stats.activeCandidates,
      icon: Activity,
      description: "Currently processing",
    },

    {
      title: "Complete",
      value: stats.completeCandidates,
      icon: CheckCircle2,
      description: "Completed candidates",
    },

    {
      title: "Returned",
      value: stats.returnedCandidates,
      icon: RotateCcw,
      description: "Returned candidates",
    },

    {
      title: "Cancelled",
      value: stats.cancelledCandidates,
      icon: XCircle,
      description: "Cancelled candidates",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>

              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {item.value}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}