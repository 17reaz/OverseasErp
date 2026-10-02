import {
  Bar,
  BarChart,
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

import type {
  DashboardCountryPassport,
} from "../services/dashboard-country-service";

interface DashboardCountryPassportsProps {
  data: DashboardCountryPassport[];
}

export function DashboardCountryPassports({
  data,
}: DashboardCountryPassportsProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          Passports by Country
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Active passports grouped by destination country.
        </p>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No country passport data available.
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={data}
                layout="vertical"
                margin={{
                  top: 8,
                  right: 16,
                  left: 8,
                  bottom: 8,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="country"
                  width={100}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip
                  cursor={{
                    opacity: 0.08,
                  }}
                  formatter={(value) => [
                    value,
                    "Passports",
                  ]}
                />

                <Bar
                  dataKey="passports"
                  name="Passports"
                  radius={[
                    0,
                    4,
                    4,
                    0,
                  ]}
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}