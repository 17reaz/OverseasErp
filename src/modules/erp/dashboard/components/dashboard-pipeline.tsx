// src/modules/erp/dashboard/components/dashboard-pipeline.tsx

import {
  Activity,
  BadgeCheck,
  CheckCircle2,
  FileCheck2,
  FingerprintPattern,
  Plane,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Vault,
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
  Finger: FingerprintPattern,
  "Police Clearance": Vault,
  Takamul: CheckCircle2,
  Visa: ShieldCheck,
  BMET: BadgeCheck,
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.map((item) => {
            const Icon =
              stageIcons[item.label as keyof typeof stageIcons] ??
              Activity;

            const isActive = item.label === "Active";

            const percentage =
              !isActive && activeCount > 0
                ? Math.round((item.value / activeCount) * 100)
                : null;

            return (
              <div
                key={item.label}
                className="rounded-md border px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />

                    <span className="truncate text-xs font-medium">
                      {item.label}
                    </span>
                  </div>

                  {percentage !== null && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {percentage}%
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-xl font-semibold tracking-tight">
                  {item.value}
                </p>

                {percentage !== null && (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
