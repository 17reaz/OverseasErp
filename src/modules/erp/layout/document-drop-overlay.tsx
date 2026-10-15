import { Upload } from "lucide-react";

export function DocumentDropOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border-2 border-dashed border-primary/40 bg-card p-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Upload className="size-6 text-primary" />
        </div>

        <div className="space-y-1">
          <p className="text-base font-semibold text-card-foreground">
            Drop document to scan
          </p>
          <p className="text-sm text-muted-foreground">
            PDF, JPG or PNG · Passport, Medical, MOFA or Visa
          </p>
        </div>
      </div>
    </div>
  );
}