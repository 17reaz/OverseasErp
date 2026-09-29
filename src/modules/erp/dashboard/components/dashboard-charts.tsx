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

import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "@/components/ui/card";

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

export function DashboardCharts({
pipeline,
trend,
}: DashboardChartsProps) {
const pipelineData = stageOrder.map((stage) => {
const item = pipeline.find(
(entry) => entry.label === stage,
);

return {
  stage,
  count: item?.value ?? 0,
};

});

return ( <div className="grid gap-6 lg:grid-cols-2">
{/* Candidate Pipeline */} <Card className="min-w-0"> <CardHeader> <CardTitle>Candidate Pipeline</CardTitle>

```
      <p className="text-sm text-muted-foreground">
        Candidates currently distributed across workflow stages.
      </p>
    </CardHeader>

    <CardContent>
      <div className="h-[300px] w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={pipelineData}
            margin={{
              top: 8,
              right: 8,
              left: -12,
              bottom: 8,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="stage"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={60}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
              tick={{ fontSize: 11 }}
            />

            <Tooltip
              cursor={{ opacity: 0.08 }}
              formatter={(value) => [
                value,
                "Candidates",
              ]}
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
    </CardContent>
  </Card>

  {/* Candidate Trend */}
  <Card className="min-w-0">
    <CardHeader>
      <CardTitle>Candidate Trend</CardTitle>

      <p className="text-sm text-muted-foreground">
        Candidate registrations over time.
      </p>
    </CardHeader>

    <CardContent>
      <div className="h-[300px] w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={trend}
            margin={{
              top: 8,
              right: 8,
              left: -12,
              bottom: 8,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
              tick={{ fontSize: 11 }}
            />

            <Tooltip
              formatter={(value) => [
                value,
                "Candidates",
              ]}
            />

            <Line
              type="monotone"
              dataKey="candidates"
              name="Candidates"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
</div>

);
}
