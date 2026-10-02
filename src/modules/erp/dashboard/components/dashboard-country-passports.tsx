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

const MAX_VISIBLE_COUNTRIES = 8;

export function DashboardCountryPassports({
  data,
}: DashboardCountryPassportsProps) {
  const visibleData = data
    .slice()
    .sort(
      (a, b) =>
        b.passports - a.passports,
    )
    .slice(0, MAX_VISIBLE_COUNTRIES);

  const totalPassports = data.reduce(
    (total, item) =>
      total + item.passports,
    0,
  );

  const remainingCountries = Math.max(
    data.length - MAX_VISIBLE_COUNTRIES,
    0,
  );

  return (
    <Card className="min-w-0 overflow-hidden">
      {/* =================================================
          HEADER
      ================================================= */}

      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            Passports by Country
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Active passports by destination.
          </p>
        </div>

        {data.length > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tracking-tight">
              {totalPassports}
            </p>

            <p className="text-xs text-muted-foreground">
              Total passports
            </p>
          </div>
        )}
      </CardHeader>

      {/* =================================================
          CONTENT
      ================================================= */}

      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[280px] flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <span className="text-lg">
                —
              </span>
            </div>

            <p className="text-sm font-medium">
              No passport data
            </p>

            <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
              Active candidate passports will
              appear here once available.
            </p>
          </div>
        ) : (
          <>
            <div
              className="w-full"
              style={{
                height: Math.max(
                  visibleData.length * 38,
                  240,
                ),
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={visibleData}
                  layout="vertical"
                  margin={{
                    top: 4,
                    right: 12,
                    left: 0,
                    bottom: 4,
                  }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    className="opacity-40"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                    }}
                    tickMargin={8}
                  />

                  <YAxis
                    type="category"
                    dataKey="country"
                    width={92}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 12,
                    }}
                    tickMargin={8}
                  />

                  <Tooltip
                    cursor={{
                      fill: "hsl(var(--muted))",
                      opacity: 0.35,
                    }}
                    contentStyle={{
                      borderRadius: 8,
                      border:
                        "1px solid hsl(var(--border))",
                      background:
                        "hsl(var(--background))",
                      boxShadow:
                        "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    labelStyle={{
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                    formatter={(value) => [
                      `${value} passports`,
                      "Count",
                    ]}
                  />

                  <Bar
                    dataKey="passports"
                    name="Passports"
                    fill="hsl(var(--primary))"
                    radius={[
                      0,
                      6,
                      6,
                      0,
                    ]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <p className="text-xs text-muted-foreground">
                Showing top{" "}
                {visibleData.length}{" "}
                {visibleData.length === 1
                  ? "country"
                  : "countries"}
              </p>

              {remainingCountries > 0 && (
                <p className="text-xs font-medium text-muted-foreground">
                  +{remainingCountries} more
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
