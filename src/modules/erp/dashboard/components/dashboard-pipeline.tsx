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
  Processing: Activity,
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

const stageOrder = [
  "Medical",
  "MOFA",
  "Finger",
  "Police Clearance",
  "Takamul",
  "Visa",
  "BMET",
  "Flight",
  "Iqama",
];

export function DashboardPipeline({ data }: Props) {
  /*
   * The dashboard service keeps the "active" pipeline item
   * for backward compatibility.
   *
   * It now represents PROCESSING candidates only.
   */
  const processingCount =
    data.find((item) => item.label === "Active")?.value ??
    data.find((item) => item.label === "Processing")?.value ??
    0;

  /*
   * Remove the old "Active" compatibility item from the
   * visible pipeline and keep only actual workflow stages.
   */
  const pipelineData = stageOrder.map((stage) => {
    const existing = data.find((item) => item.label === stage);

    return {
      label: stage,
      value: existing?.value ?? 0,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Pipeline</CardTitle>

        <p className="text-sm text-muted-foreground">
          Processing candidates by workflow stage.
        </p>
      </CardHeader>

      <CardContent>
        {processingCount === 0 ? (
          <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <Activity className="mx-auto mb-2 h-4 w-4 text-muted-foreground" />

              <p className="text-sm font-medium">
                No candidates in processing
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Hold candidates are excluded from the pipeline.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {pipelineData.map((item) => {
              const Icon =
                stageIcons[item.label as keyof typeof stageIcons] ??
                Activity;

              const percentage =
                processingCount > 0
                  ? Math.round((item.value / processingCount) * 100)
                  : 0;

              return (
                <div
                  key={item.label}
                  className="rounded-md border px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 shrink-0" />

                      <span className="truncate text-xs font-medium">
                        {item.label}
                      </span>
                    </div>

                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {percentage}%
                    </span>
                  </div>

                  <p className="mt-1.5 text-xl font-semibold tracking-tight">
                    {item.value}
                  </p>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />

            <span>Processing</span>
          </div>

          <span className="text-sm font-semibold">
            {processingCount}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
