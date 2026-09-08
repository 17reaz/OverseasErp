// src/modules/erp/dashboard/components/dashboard-hold-stages.tsx

import {
  AlertTriangle,
  FileCheck2,
  ShieldAlert,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HoldReason {
  reason: string;
  label: string;
  count: number;
}

interface Props {
  reasons: HoldReason[];
  total: number;
}

const stageConfig: Record<
  string,
  {
    label: string;
    description: string;
    icon: typeof Stethoscope;
  }
> = {
  medical_expired: {
    label: "Medical",
    description: "Medical validity expired",
    icon: Stethoscope,
  },

  mofa_expired: {
    label: "MOFA",
    description: "MOFA validity expired",
    icon: FileCheck2,
  },

  visa_expired: {
    label: "Visa",
    description: "Visa validity expired",
    icon: ShieldAlert,
  },

  iqama_overdue: {
    label: "Iqama",
    description: "Iqama follow-up overdue",
    icon: UserRound,
  },

  manual_hold: {
    label: "Manual Hold",
    description: "Manually placed on hold",
    icon: AlertTriangle,
  },
};

export function DashboardHoldStages({
  reasons,
  total,
}: Props) {
  const knownReasons = reasons.filter(
    (item) => stageConfig[item.reason],
  );

  const unknownReasons = reasons.filter(
    (item) => !stageConfig[item.reason],
  );

  const items = [
    ...knownReasons,
    ...unknownReasons,
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Hold / Failed Stages</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Candidates blocked or failed at each workflow stage.
            </p>
          </div>

          <div className="rounded-md border px-3 py-1.5 text-right">
            <p className="text-lg font-semibold leading-none">
              {total}
            </p>

            <p className="mt-1 text-[11px] text-muted-foreground">
              On hold
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <ShieldAlert className="mx-auto mb-2 h-4 w-4 text-muted-foreground" />

              <p className="text-sm font-medium">
                No failed stages
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                No active candidates are currently on hold.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {items.map((item) => {
              const config =
                stageConfig[item.reason];

              const Icon =
                config?.icon ?? AlertTriangle;

              const label =
                config?.label ?? item.label;

              const description =
                config?.description ?? item.label;

              const percentage =
                total > 0
                  ? Math.round(
                      (item.count / total) * 100,
                    )
                  : 0;

              return (
                <div
                  key={item.reason}
                  className="rounded-md border px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {label}
                        </p>

                        <p className="truncate text-[11px] text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      {percentage}%
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-2xl font-semibold tracking-tight">
                      {item.count}
                    </span>

                    <span className="text-[11px] text-muted-foreground">
                      candidate
                      {item.count === 1
                        ? ""
                        : "s"}
                    </span>
                  </div>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-destructive/70 transition-all"
                      style={{
                        width: `${Math.min(
                          percentage,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}