import type { DashboardCountryPassport } from "../services/dashboard-country-service";

interface DashboardCountryPassportsProps {
  data: DashboardCountryPassport[];
}

const MAX_VISIBLE_COUNTRIES = 6;

export function DashboardCountryPassports({
  data,
}: DashboardCountryPassportsProps) {
  const sortedData = data
    .filter((item) => item.country.trim() && item.passports > 0)
    .slice()
    .sort(
      (a, b) =>
        b.passports - a.passports || a.country.localeCompare(b.country),
    );

  const totalPassports = sortedData.reduce(
    (total, item) => total + item.passports,
    0,
  );

  const visibleData = sortedData.slice(0, MAX_VISIBLE_COUNTRIES);

  const remainingCountries = Math.max(
    sortedData.length - MAX_VISIBLE_COUNTRIES,
    0,
  );

  const maxPassports = visibleData[0]?.passports ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-none">
            Passports by Country
          </h2>

          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            Active passports by destination
          </p>
        </div>

        {totalPassports > 0 && (
          <div className="shrink-0 text-right leading-none">
            <p className="text-lg font-semibold tabular-nums">
              {totalPassports}
            </p>

            <p className="mt-0.5 text-[10px] text-muted-foreground">Total</p>
          </div>
        )}
      </div>

      {/* Body */}
      {sortedData.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <p className="text-xs font-medium">No passport data</p>

          <p className="mt-0.5 max-w-[240px] text-[11px] text-muted-foreground">
            Active candidate passports will appear here.
          </p>
        </div>
      ) : (
        <>
          <ul className="min-h-0 flex-1 space-y-2.5 overflow-auto">
            {visibleData.map(({ country, passports }, index) => {
              const percentage =
                totalPassports > 0 ? (passports / totalPassports) * 100 : 0;

              const barWidth =
                maxPassports > 0 ? (passports / maxPassports) * 100 : 0;

              return (
                <li key={country} className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                        {index + 1}
                      </span>

                      <span
                        className="truncate text-xs font-medium"
                        title={country}
                      >
                        {country}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-baseline gap-1.5">
                      <span className="text-xs font-semibold tabular-nums">
                        {passports}
                      </span>

                      <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex shrink-0 items-center justify-between border-t pt-2">
            <p className="text-[11px] text-muted-foreground">
              Showing {visibleData.length} of {sortedData.length}
            </p>

            {remainingCountries > 0 && (
              <span className="text-[11px] font-medium text-primary">
                +{remainingCountries} more
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}