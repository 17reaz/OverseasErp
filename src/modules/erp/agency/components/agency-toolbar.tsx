
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Grid2X2,
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type AgencyFilterState = {
  status: "all" | "active" | "inactive";
};

export type AgencySortState = {
  field: "sl" | "name" | "code" | "created_at" | "updated_at";
  mode: "ascending" | "descending";
};

export type AgencyViewMode = "list" | "grid";

interface AgencyToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  filter: AgencyFilterState;
  onFilterChange: (filter: AgencyFilterState) => void;

  sort: AgencySortState;
  onSortChange: (sort: AgencySortState) => void;

  viewMode: AgencyViewMode;
  onViewModeChange: (mode: AgencyViewMode) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;
}

function ViewToggle({
  value,
  onChange,
}: {
  value: AgencyViewMode;
  onChange: (mode: AgencyViewMode) => void;
}) {
  return (
    <div className="inline-flex h-9 shrink-0 items-center rounded-md border bg-muted/30 p-0.5">
      <Button
        type="button"
        variant={value === "list" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 gap-1.5 px-2.5"
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={value === "list"}
        title="List view"
      >
        <List className="h-4 w-4" />
        <span className="hidden 2xl:inline">List</span>
      </Button>

      <Button
        type="button"
        variant={value === "grid" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 gap-1.5 px-2.5"
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        title="Grid view"
      >
        <Grid2X2 className="h-4 w-4" />
        <span className="hidden 2xl:inline">Grid</span>
      </Button>
    </div>
  );
}

export function AgencyToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search agency...",
  filter,
  onFilterChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: AgencyToolbarProps) {
  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create Agency"
    >
      {/* STATUS */}
      <Select
        value={filter.status}
        onValueChange={(value) =>
          onFilterChange({
            ...filter,
            status: value as AgencyFilterState["status"],
          })
        }
      >
        <SelectTrigger className="w-[110px] sm:w-[140px]" aria-label="Filter agencies">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* SORT FIELD */}
      <Select
        value={sort.field}
        onValueChange={(value) =>
          onSortChange({
            ...sort,
            field: value as AgencySortState["field"],
          })
        }
      >
        <SelectTrigger className="w-[110px] sm:w-[140px]" aria-label="Sort agencies">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="sl">SL</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="code">Code</SelectItem>
          <SelectItem value="created_at">Created</SelectItem>
          <SelectItem value="updated_at">Updated</SelectItem>
        </SelectContent>
      </Select>

      {/* SORT DIRECTION */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() =>
          onSortChange({
            ...sort,
            mode: sort.mode === "ascending" ? "descending" : "ascending",
          })
        }
        title={sort.mode === "ascending" ? "Ascending" : "Descending"}
        aria-label="Change sort direction"
      >
        {sort.mode === "ascending" ? (
          <ArrowUpAZ className="h-4 w-4" />
        ) : (
          <ArrowDownAZ className="h-4 w-4" />
        )}
      </Button>

      {/* VIEW TOGGLE */}
      <ViewToggle value={viewMode} onChange={onViewModeChange} />
    </PageToolbar>
  );
}
