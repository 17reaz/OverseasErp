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

export function DashboardCharts({ pipeline, trend }: DashboardChartsProps) {
  const pipelineData = stageOrder.map((stage) => {
    const item = pipeline.find((entry) => entry.label === stage);

    return {
      stage,
      count: item?.value ?? 0,
    };
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Candidate Pipeline */}
      <section className="flex min-h-[140px] min-w-0 flex-1 flex-col">
        <h3 className="text-xs font-semibold leading-none">
          Candidate Pipeline
        </h3>

        <p className="mb-1 mt-0.5 truncate text-[11px] text-muted-foreground">
          Candidates across workflow stages
        </p>

        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pipelineData}
              margin={{
                top: 4,
                right: 4,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="stage"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
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
                tick={{ fontSize: 10 }}
              />

              <Tooltip
                cursor={{ opacity: 0.08 }}
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
        </div>
      </section>

      {/* Candidate Trend */}
      <section className="flex min-h-[140px] min-w-0 flex-1 flex-col border-t pt-3">
        <h3 className="text-xs font-semibold leading-none">
          Candidate Trend
        </h3>

        <p className="mb-1 mt-0.5 truncate text-[11px] text-muted-foreground">
          Registrations over time
        </p>

        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trend}
              margin={{
                top: 4,
                right: 8,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />

              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
                tick={{ fontSize: 10 }}
              />

              <Tooltip formatter={(value) => [value, "Candidates"]} />

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
        </div>
      </section>
    </div>
  );
}