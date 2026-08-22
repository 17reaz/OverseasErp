import { Plus, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FlightToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreate: () => void;
  refreshing?: boolean;
}

export function FlightToolbar({
  search,
  onSearchChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: FlightToolbarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search candidate, passport, flight no or airline..."
          className="pr-9 pl-9"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={refreshing}
      >
        <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      </Button>

      <Button type="button" onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" /> Create
      </Button>
    </div>
  );
}