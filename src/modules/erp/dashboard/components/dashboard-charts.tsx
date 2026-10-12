import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardData } from "../dashboard-service";

interface DashboardChartsProps {
  pipeline: DashboardData["pipeline"];
  trend: DashboardData["trend"];
}

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

const stageShort: Record<string, string> = {
  "Police Clearance": "PCC",
};

const axisTick = { fontSize: 10 };

const tooltipStyle = {
  fontSize: 11,
  padding: "4px 8px",
  borderRadius: 6,
};

function ChartSection({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex min-h-[140px] min-w-0 flex-1 flex-col ${className}`}
    >
      <div className="mb-1 flex items-baseline gap-2">
        <h3 className="text-xs font-semibold leading-none">{title}</h3>

        <p className="truncate text-[11px] text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function DashboardCharts({ pipeline, trend }: DashboardChartsProps) {
  const pipelineData = stageOrder.map((stage) => {
    const item = pipeline.find((entry) => entry.label === stage);

    return {
      stage: stageShort[stage] ?? stage,
      count: item?.value ?? 0,
    };
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ChartSection
        title="Candidate Pipeline"
        subtitle="Across workflow stages"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={pipelineData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="stage"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={40}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
              tick={axisTick}
            />

            <Tooltip
              cursor={{ opacity: 0.08 }}
              contentStyle={tooltipStyle}
              formatter={(value) => [value, "Candidates"]}
            />

            <Bar
              dataKey="count"
              name="Candidates"
              radius={[4, 4, 0, 0]}
              fill="hsl(var(--primary))"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection
        title="Candidate Trend"
        subtitle="Registrations over time"
        className="border-t pt-3"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trend}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
              tick={axisTick}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [value, "Candidates"]}
            />

            <Line
              type="monotone"
              dataKey="candidates"
              name="Candidates"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>
    </div>
  );
}