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
    <div className="flex items-stretch gap-3 rounded-lg border bg-background px-3 py-2">
      {/* LEFT: processing total */}
      <div className="flex shrink-0 items-center gap-2 border-r pr-3">
        <Activity className="size-4 text-muted-foreground" />

        <div className="leading-tight">
          <p className="text-[10px] text-muted-foreground">Processing</p>

          <p className="text-base font-semibold tracking-tight">
            {processingCount}
          </p>
        </div>
      </div>

      {/* RIGHT: stages in one line */}
      {processingCount === 0 ? (
        <p className="flex min-w-0 flex-1 items-center truncate text-xs text-muted-foreground">
          No candidates in processing. Hold candidates are excluded from the
          pipeline.
        </p>
      ) : (
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max items-stretch gap-2 lg:min-w-0">
            {pipelineData.map((item) => {
              const Icon =
                stageIcons[item.label as keyof typeof stageIcons] ?? Activity;

              const percentage =
                processingCount > 0
                  ? Math.round((item.value / processingCount) * 100)
                  : 0;

              return (
                <div
                  key={item.label}
                  title={`${item.label}: ${item.value} (${percentage}%)`}
                  className="flex min-w-[84px] flex-1 flex-col justify-center gap-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex min-w-0 items-center gap-1 text-muted-foreground">
                      <Icon className="size-3 shrink-0" />

                      <span className="truncate text-[10px] font-medium">
                        {item.label === "Police Clearance"
                          ? "PCC"
                          : item.label}
                      </span>
                    </div>

                    <span className="shrink-0 text-sm font-semibold leading-none">
                      {item.value}
                    </span>
                  </div>

                  <div className="h-1 overflow-hidden rounded-full bg-muted">
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
        </div>
      )}
    </div>
  );
}