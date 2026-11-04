import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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

const axisTick = { fontSize: 11, fill: "currentColor", opacity: 0.6 };

const tooltipStyle = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 6,
};

function ChartSection({
  title,
  subtitle,
  heightClass,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  heightClass: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 ${className}`}>
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold leading-none">{title}</h3>

        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {/* Fixed height, tai ResponsiveContainer collapse hobe na */}
      <div className={`w-full text-primary ${heightClass}`}>{children}</div>
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
    <div className="flex flex-col gap-4">
      <ChartSection
        title="Candidate Pipeline"
        subtitle="Across workflow stages"
        heightClass="h-44"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={pipelineData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              strokeOpacity={0.12}
            />

            <XAxis
              dataKey="stage"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={44}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
              tick={axisTick}
            />

            <Tooltip
              cursor={{ fill: "currentColor", opacity: 0.08 }}
              contentStyle={tooltipStyle}
              formatter={(value) => [value, "Candidates"]}
            />

            <Bar
              dataKey="count"
              name="Candidates"
              radius={[4, 4, 0, 0]}
              fill="currentColor"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection
        title="Candidate Trend"
        subtitle="Registrations over time"
        heightClass="h-52"
        className="border-t pt-4"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trend}
            margin={{ top: 18, right: 16, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              strokeOpacity={0.12}
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
              padding={{ left: 12, right: 12 }}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
              tick={axisTick}
              domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [value, "Candidates"]}
            />

            <Area
              type="monotone"
              dataKey="candidates"
              name="Candidates"
              stroke="currentColor"
              strokeWidth={2.5}
              fill="currentColor"
              fillOpacity={0.15}
              dot={{ r: 4, fill: "currentColor", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="candidates"
                position="top"
                offset={8}
                fontSize={11}
                fill="currentColor"
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </ChartSection>
    </div>
  );
}