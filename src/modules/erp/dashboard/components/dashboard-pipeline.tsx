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
    <div className="flex flex-col gap-2 rounded-lg border bg-background p-2 sm:flex-row sm:items-stretch sm:gap-3">
      {/* LEFT: processing total (highlight) */}
      <div className="flex shrink-0 items-center gap-2.5 rounded-md bg-primary px-3 py-2 text-primary-foreground sm:min-w-[110px]">
        <Activity className="size-5 shrink-0" />

        <div className="leading-tight">
          <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
            Processing
          </p>

          <p className="text-2xl font-bold tracking-tight">
            {processingCount}
          </p>
        </div>
      </div>

      {/* RIGHT: stages (no scrollbar, wraps responsively) */}
      {processingCount === 0 ? (
        <p className="flex min-w-0 flex-1 items-center text-xs text-muted-foreground">
          No candidates in processing. Hold candidates are excluded from the
          pipeline.
        </p>
      ) : (
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5 md:grid-cols-5 xl:grid-cols-9">
          {pipelineData.map((item) => {
            const Icon =
              stageIcons[item.label as keyof typeof stageIcons] ?? Activity;

            const percentage =
              processingCount > 0
                ? Math.round((item.value / processingCount) * 100)
                : 0;

            const hasValue = item.value > 0;

            return (
              <div
                key={item.label}
                title={`${item.label}: ${item.value} (${percentage}%)`}
                className={[
                  "flex min-w-0 flex-col justify-center gap-1 rounded-md border px-2 py-1.5 transition-colors",
                  hasValue
                    ? "border-primary/30 bg-primary/5"
                    : "bg-muted/20",
                ].join(" ")}
              >
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Icon
                    className={[
                      "size-3 shrink-0",
                      hasValue ? "text-primary" : "",
                    ].join(" ")}
                  />

                  <span className="truncate text-[10px] font-medium">
                    {item.label === "Police Clearance" ? "PCC" : item.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-1">
                  <span
                    className={[
                      "text-lg font-bold leading-none tracking-tight",
                      hasValue ? "text-foreground" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {item.value}
                  </span>

                  <span className="text-[9px] text-muted-foreground">
                    {percentage}%
                  </span>
                </div>

                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}