
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { PageToolbar } from "../../shared/ui/page-toolbar";

export type ResultFilter = "all" | "pending" | "pass" | "fail";

interface TradeTestToolbarProps {
  viewMode: "all" | "takamul-able";
  onViewModeChange: (mode: "all" | "takamul-able") => void;

  search: string;
  onSearchChange: (value: string) => void;

  resultFilter: ResultFilter;
  onResultFilterChange: (value: ResultFilter) => void;

  onRefresh: () => void;
  onCreate: () => void;
  refreshing?: boolean;
}

export function TradeTestToolbar({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  resultFilter,
  onResultFilterChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: TradeTestToolbarProps) {
  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={
        viewMode === "all"
          ? "Search candidate, passport or center..."
          : "Search candidate, passport or profession..."
      }
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create"
    >
      {/* View Switch */}
      <div className="flex shrink-0 items-center gap-1 rounded-md border p-1">
        <Button
          type="button"
          size="sm"
          variant={viewMode === "all" ? "secondary" : "ghost"}
          onClick={() => onViewModeChange("all")}
        >
          All Records
        </Button>

        <Button
          type="button"
          size="sm"
          variant={viewMode === "takamul-able" ? "secondary" : "ghost"}
          onClick={() => onViewModeChange("takamul-able")}
        >
          Takamul-able
        </Button>
      </div>

      {/* Trade Test Result Filter */}
      {viewMode === "all" && (
        <Select
          value={resultFilter}
          onValueChange={(value) =>
            onResultFilterChange(value as ResultFilter)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Result Filter" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="pass">Pass</SelectItem>
            <SelectItem value="fail">Fail</SelectItem>
          </SelectContent>
        </Select>
      )}
    </PageToolbar>
  );
}
