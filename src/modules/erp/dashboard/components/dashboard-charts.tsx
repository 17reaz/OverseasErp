export function DashboardCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="min-h-80 rounded-lg border p-6">
        <h2 className="font-semibold">Candidate Overview</h2>

        <div className="mt-6 flex min-h-56 items-center justify-center text-sm text-muted-foreground">
          Chart will be added here.
        </div>
      </div>

      <div className="min-h-80 rounded-lg border p-6">
        <h2 className="font-semibold">Processing Overview</h2>

        <div className="mt-6 flex min-h-56 items-center justify-center text-sm text-muted-foreground">
          Chart will be added here.
        </div>
      </div>
    </div>
  );
}