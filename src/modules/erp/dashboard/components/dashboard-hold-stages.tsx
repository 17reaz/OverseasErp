import {
  AlertTriangle,
  FileCheck2,
  ShieldAlert,
  Stethoscope,
  UserRound,
} from "lucide-react";

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
    description: "Validity expired",
    icon: Stethoscope,
  },
  mofa_expired: {
    label: "MOFA",
    description: "Validity expired",
    icon: FileCheck2,
  },
  visa_expired: {
    label: "Visa",
    description: "Validity expired",
    icon: ShieldAlert,
  },
  iqama_overdue: {
    label: "Iqama",
    description: "Follow-up overdue",
    icon: UserRound,
  },
  manual_hold: {
    label: "Manual Hold",
    description: "Placed on hold manually",
    icon: AlertTriangle,
  },
};

export function DashboardHoldStages({ reasons, total }: Props) {
  // known reasons first, then unknown ones
  const items = [
    ...reasons.filter((item) => stageConfig[item.reason]),
    ...reasons.filter((item) => !stageConfig[item.reason]),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-none">
            Hold / Failed Stages
          </h2>

          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            Candidates blocked at each workflow stage
          </p>
        </div>

        <div className="shrink-0 rounded-md border px-2.5 py-1 text-right leading-none">
          <p className="text-base font-semibold tabular-nums">{total}</p>

          <p className="mt-0.5 text-[10px] text-muted-foreground">On hold</p>
        </div>
      </div>

      {/* Body */}
      {items.length === 0 ? (
        <div className="flex min-h-24 flex-1 items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <ShieldAlert className="mx-auto mb-1.5 size-4 text-muted-foreground" />

            <p className="text-xs font-medium">No failed stages</p>

            <p className="mt-0.5 text-[11px] text-muted-foreground">
              No active candidates are on hold.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 auto-rows-min content-start gap-2 overflow-auto sm:grid-cols-2">
          {items.map((item) => {
            const config = stageConfig[item.reason];
            const Icon = config?.icon ?? AlertTriangle;
            const label = config?.label ?? item.label;
            const description = config?.description ?? item.label;

            const percentage =
              total > 0 ? Math.round((item.count / total) * 100) : 0;

            return (
              <div key={item.reason} className="rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium leading-tight">
                      {label}
                    </p>

                    <p className="truncate text-[10px] text-muted-foreground">
                      {description}
                    </p>
                  </div>

                  <div className="shrink-0 text-right leading-none">
                    <p className="text-lg font-semibold tabular-nums">
                      {item.count}
                    </p>

                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {percentage}%
                    </p>
                  </div>
                </div>

                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-destructive/70 transition-all"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}