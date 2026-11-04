"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
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

interface Props {
  data: DashboardData["trend"];
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <div className="font-medium">{label}</div>
      <div className="text-muted-foreground">
        {payload[0].value} candidates
      </div>
    </div>
  );
}

export function DashboardTrend({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Intake</CardTitle>

        <p className="text-sm text-muted-foreground">
          Candidate records created over the last six months.
        </p>
      </CardHeader>

      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-border"
              />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />

              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{ strokeDasharray: "3 3" }}
              />

              <Area
                type="monotone"
                dataKey="candidates"
                strokeWidth={2}
                className="stroke-primary fill-primary/20"
                dot={{ r: 3, className: "fill-primary stroke-primary" }}
                activeDot={{ r: 5, className: "fill-primary stroke-primary" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}