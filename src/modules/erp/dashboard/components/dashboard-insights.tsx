import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Plane,
  Stethoscope,
  Users,
} from "lucide-react";

const trendData = [
  { month: "Mar", candidates: 72 },
  { month: "Apr", candidates: 94 },
  { month: "May", candidates: 82 },
  { month: "Jun", candidates: 118 },
  { month: "Jul", candidates: 104 },
  { month: "Aug", candidates: 136 },
];

const pipelineData = [
  {
    label: "Candidates",
    value: 1284,
    percentage: 100,
    icon: Users,
  },
  {
    label: "Medical",
    value: 642,
    percentage: 50,
    icon: Stethoscope,
  },
  {
    label: "MOFA",
    value: 481,
    percentage: 37,
    icon: FileCheck2,
  },
  {
    label: "Visa",
    value: 326,
    percentage: 25,
    icon: CheckCircle2,
  },
  {
    label: "Flight",
    value: 94,
    percentage: 7,
    icon: Plane,
  },
];

const pendingItems = [
  {
    label: "Medical Pending",
    count: 24,
    description: "Candidates waiting for medical",
    icon: Stethoscope,
  },
  {
    label: "MOFA Pending",
    count: 18,
    description: "Applications waiting for processing",
    icon: FileCheck2,
  },
  {
    label: "Visa Pending",
    count: 12,
    description: "Candidates waiting for visa",
    icon: Clock3,
  },
  {
    label: "Flight Pending",
    count: 7,
    description: "Candidates waiting for flight",
    icon: Plane,
  },
];

function CandidateTrendChart() {
  const maxValue = Math.max(...trendData.map((item) => item.candidates));

  const width = 640;
  const height = 220;
  const paddingX = 32;
  const paddingY = 24;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = trendData
    .map((item, index) => {
      const x =
        paddingX +
        (index / (trendData.length - 1)) * chartWidth;

      const y =
        height -
        paddingY -
        (item.candidates / maxValue) * chartHeight;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-lg border bg-background p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />

            <h2 className="font-semibold">
              Candidate Trend
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            New candidates received over the last 6 months
          </p>
        </div>

        <span className="text-xs text-muted-foreground">
          Last 6 months
        </span>
      </div>

      <div className="mt-6">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[220px] w-full"
          preserveAspectRatio="none"
        >
          {[0, 1, 2, 3].map((line) => {
            const y =
              paddingY +
              (line / 3) * chartHeight;

            return (
              <line
                key={line}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.08"
              />
            );
          })}

          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {trendData.map((item, index) => {
            const x =
              paddingX +
              (index / (trendData.length - 1)) *
                chartWidth;

            const y =
              height -
              paddingY -
              (item.candidates / maxValue) *
                chartHeight;

            return (
              <g key={item.month}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="currentColor"
                />

                <text
                  x={x}
                  y={height - 4}
                  textAnchor="middle"
                  fontSize="12"
                  fill="currentColor"
                  opacity="0.55"
                >
                  {item.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between border-t pt-4">
        <div>
          <p className="text-2xl font-semibold">
            136
          </p>

          <p className="text-xs text-muted-foreground">
            Candidates this month
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-medium">
            +30.7%
          </p>

          <p className="text-xs text-muted-foreground">
            vs previous month
          </p>
        </div>
      </div>
    </div>
  );
}

function RecruitmentPipeline() {
  return (
    <div className="rounded-lg border bg-background p-5">
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />

          <h2 className="font-semibold">
            Recruitment Pipeline
          </h2>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Candidate distribution across processing stages
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {pipelineData.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />

                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </div>

                <span className="text-sm font-semibold">
                  {item.value}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{
                    width: `${item.percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PendingWork() {
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="font-semibold">
            Pending Work
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Actions that need attention
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </button>
      </div>

      <div className="divide-y">
        {pendingItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {item.label}
                  </p>

                  <span className="text-sm font-semibold">
                    {item.count}
                  </span>
                </div>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardInsights() {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <CandidateTrendChart />
        <RecruitmentPipeline />
      </div>

      <PendingWork />
    </>
  );
}