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

const MAX_VISIBLE_COUNTRIES = 6;

export function DashboardCountryPassports({
  data,
}: DashboardCountryPassportsProps) {
  const sortedData = data
    .filter(
      (item) =>
        item.country.trim() &&
        item.passports > 0,
    )
    .slice()
    .sort(
      (a, b) =>
        b.passports - a.passports ||
        a.country.localeCompare(b.country),
    );

  const totalPassports = sortedData.reduce(
    (total, item) => total + item.passports,
    0,
  );

  const visibleData = sortedData.slice(
    0,
    MAX_VISIBLE_COUNTRIES,
  );

  const remainingCountries = Math.max(
    sortedData.length - MAX_VISIBLE_COUNTRIES,
    0,
  );

  const maxPassports =
    visibleData[0]?.passports ?? 0;

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            Passports by Country
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Active passports by destination
          </p>
        </div>

        {totalPassports > 0 && (
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

      <CardContent>
        {sortedData.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <span className="text-lg text-muted-foreground">
                —
              </span>
            </div>

            <p className="text-sm font-medium">
              No passport data
            </p>

            <p className="mt-1 max-w-[240px] text-xs leading-5 text-muted-foreground">
              Active candidate passports will appear
              here once available.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {visibleData.map(
              ({ country, passports }, index) => {
                const percentage =
                  totalPassports > 0
                    ? (passports / totalPassports) * 100
                    : 0;

                const barWidth =
                  maxPassports > 0
                    ? (passports / maxPassports) * 100
                    : 0;

                return (
                  <div
                    key={country}
                    className="group space-y-2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                          {index + 1}
                        </span>

                        <span
                          className="truncate text-sm font-medium"
                          title={country}
                        >
                          {country}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {passports}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out group-hover:opacity-80"
                        style={{
                          width: `${barWidth}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              },
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {visibleData.length} of{" "}
                {sortedData.length} countries
              </p>

              {remainingCountries > 0 && (
                <button
                  type="button"
                  className="text-xs font-medium text-primary transition-colors hover:underline"
                >
                  +{remainingCountries} more
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}