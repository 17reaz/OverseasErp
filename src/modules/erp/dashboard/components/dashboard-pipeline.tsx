// src/modules/erp/dashboard/components/dashboard-pipeline.tsx

import {
  Activity,
  FileCheck2,
  FileText,
  Plane,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { DashboardData } from "../dashboard-service";

interface Props {
  data: DashboardData["pipeline"];
}

const stageIcons = {
  Active: Activity,
  Medical: Stethoscope,
  MOFA: FileCheck2,
  Visa: FileText,
  Flight: Plane,
  Iqama: UserRound,
};

export function DashboardPipeline({ data }: Props) {
  const activeCount =
    data.find((item) => item.label === "Active")?.value ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Pipeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Active candidates by processing stage.
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {data.map((item) => {
            const Icon =
              stageIcons[item.label as keyof typeof stageIcons] ??
              Activity;

            const percentage =
              activeCount > 0
                ? Math.round((item.value / activeCount) * 100)
                : 0;

            return (
              <Card
                key={item.label}
                className="border bg-background shadow-none transition-colors hover:bg-muted/40"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>

                    {item.label !== "Active" && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {percentage}%
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      {item.label}
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-tight">
                      {item.value}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.label === "Active"
                        ? "Total active"
                        : `of ${activeCount} active`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}