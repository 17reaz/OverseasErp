import {
  Activity,
  CheckCircle2,
  RotateCcw,
  Users,
  XCircle,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionValue } from "@/components/shared/motion";

import type { DashboardData } from "../dashboard-service";

interface DashboardStatsProps {
  stats: DashboardData["stats"];
}

const GRID_CLASS = "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5";

export function DashboardStats({ stats }: DashboardStatsProps) {
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
    <div className={GRID_CLASS}>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title} className="gap-0.5 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {item.title}
              </span>

              <Icon className="size-3.5 text-muted-foreground" />
            </div>

            <div className="text-xl font-semibold leading-tight tracking-tight tabular-nums">
              <MotionValue value={item.value} />
            </div>

            <p className="truncate text-[11px] text-muted-foreground">
              {item.description}
            </p>
          </Card>
        );
      })}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="gap-0.5 px-3 py-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-12" />
            <Skeleton className="size-3.5 rounded-full" />
          </div>

          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-24" />
        </Card>
      ))}
    </div>
  );
}