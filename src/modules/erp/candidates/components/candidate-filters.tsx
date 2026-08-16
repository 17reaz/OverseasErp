import {
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CandidateFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function CandidateFilters({
  search,
  onSearchChange,
  onRefresh,
  refreshing = false,
}: CandidateFiltersProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative w-full sm:w-[280px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search candidates..."
          className="pl-9"
        />
      </div>

      {/* Filter */}
      <Button
        variant="outline"
        type="button"
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Filter
      </Button>

      {/* Refresh */}
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
      >
        <RefreshCw
          className={
            refreshing
              ? "h-4 w-4 animate-spin"
              : "h-4 w-4"
          }
        />
      </Button>
    </div>
  );
}