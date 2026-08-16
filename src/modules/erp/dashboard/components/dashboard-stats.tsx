export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Total Candidates
        </p>

        <p className="mt-2 text-2xl font-semibold">
          0
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Medical Pending
        </p>

        <p className="mt-2 text-2xl font-semibold">
          0
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Visa Processing
        </p>

        <p className="mt-2 text-2xl font-semibold">
          0
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Flight Ready
        </p>

        <p className="mt-2 text-2xl font-semibold">
          0
        </p>
      </div>
    </div>
  );
}