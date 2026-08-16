import {
  ArrowUpDown,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PageToolbarProps {
  title: string;

  search?: string;
  searchPlaceholder?: string;

  onSearchChange?: (value: string) => void;
  onFilter?: () => void;
  onSort?: () => void;
  onRefresh?: () => void;
  onCreate?: () => void;

  refreshing?: boolean;
}

export function PageToolbar({
  title,
  search = "",
  searchPlaceholder = "Search...",
  onSearchChange,
  onFilter,
  onSort,
  onRefresh,
  onCreate,
  refreshing = false,
}: PageToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b bg-background px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Page title */}
      <div className="shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {title}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
        {/* Search */}
        <div className="relative w-full sm:w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              onSearchChange?.(event.target.value)
            }
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        {/* Filter */}
        <Button
          variant="outline"
          type="button"
          onClick={onFilter}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filter
        </Button>

        {/* Sort */}
        <Button
          variant="outline"
          type="button"
          onClick={onSort}
        >
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Sort
        </Button>

        {/* Refresh */}
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw
            className={
              refreshing
                ? "h-4 w-4 animate-spin"
                : "h-4 w-4"
            }
          />
        </Button>

        {/* Create */}
        <Button
          type="button"
          onClick={onCreate}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create
        </Button>
      </div>
    </div>
  );
}