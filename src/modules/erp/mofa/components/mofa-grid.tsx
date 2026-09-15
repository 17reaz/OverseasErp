import type { Mofa } from "../mofa-service";
import { MofaPipelineCard } from "./mofa-pipeline-card";

interface MofaGridProps {
  items: Mofa[];
  loading?: boolean;
  onOpen?: (mofa: Mofa) => void;
}

function MofaGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-[250px] animate-pulse rounded-xl border bg-muted/40"
        />
      ))}
    </div>
  );
}

export function MofaGrid({
  items,
  loading = false,
  onOpen,
}: MofaGridProps) {
  if (loading) {
    return <MofaGridSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed">
        <div className="text-center">
          <p className="text-sm font-medium">
            No active MOFA
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Approved MOFAs that are ready for Visa will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((mofa) => (
        <MofaPipelineCard
          key={mofa.id}
          item={mofa}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}