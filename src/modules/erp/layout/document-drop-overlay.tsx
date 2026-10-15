import { Upload } from "lucide-react";

export function DocumentDropOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-background p-10 text-center shadow-xl">
        <Upload className="size-10 text-primary" />
        <p className="text-lg font-semibold">Drop document to scan</p>
        <p className="text-sm text-muted-foreground">
          PDF, JPG or PNG · Passport, Medical, MOFA or Visa
        </p>
      </div>
    </div>
  );
}