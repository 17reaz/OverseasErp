import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";

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

interface AgencyToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  filter: AgencyFilterState;
  onFilterChange: (filter: AgencyFilterState) => void;

  sort: AgencySortState;
  onSortChange: (sort: AgencySortState) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;
}

export function AgencyToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search agency...",
  filter,
  onFilterChange,
  sort,
  onSortChange,
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
        <SelectTrigger className="w-[140px]" aria-label="Filter agencies">
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
        <SelectTrigger className="w-[140px]" aria-label="Sort agencies">
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
        onClick={() =>
          onSortChange({
            ...sort,
            mode: sort.mode === "ascending" ? "descending" : "ascending",
          })
        }
        title={sort.mode === "ascending" ? "Ascending" : "Descending"}
      >
        {sort.mode === "ascending" ? (
          <ArrowUpAZ className="h-4 w-4" />
        ) : (
          <ArrowDownAZ className="h-4 w-4" />
        )}
      </Button>
    </PageToolbar>
  );
}
