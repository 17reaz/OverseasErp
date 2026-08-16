export function DashboardTable() {
  return (
    <div className="rounded-lg border">
      <div className="border-b p-6">
        <h2 className="font-semibold">Recent Candidates</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Recently updated candidate records.
        </p>
      </div>

      <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
        Recent candidates will appear here.
      </div>
    </div>
  );
}