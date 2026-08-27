import {
  ArrowDownAZ,
  ArrowUpAZ,
  List,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { MofaStage } from "../mofa-service";

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type MofaFilterState = {
  view: MofaStage | "all";
  month: "all" | string;
};

export type MofaSortState = {
  mode: "ascending" | "descending" | "custom";
  field:
    | "name"
    | "passport_no"
    | "application_number"
    | "application_date"
    | "created_at"
    | "updated_at";
};

export type MofaViewMode = "list" | "grid";

interface MofaToolbarProps {
  search: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;

  filter: MofaFilterState;
  onFilterChange: (filter: MofaFilterState) => void;

  sort: MofaSortState;
  onSortChange: (sort: MofaSortState) => void;

  viewMode: MofaViewMode;
  onViewModeChange: (mode: MofaViewMode) => void;
}

function getMonthOptions() {
  const months: { value: string; label: string }[] = [];
  const currentDate = new Date();

  for (let index = 0; index < 12; index++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - index,
      1,
    );

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const value = `${year}-${month}`;

    const label = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    months.push({ value, label });
  }

  return months;
}

export function MofaToolbar({
  search,
  searchPlaceholder = "Search candidate, passport or application...",
  onSearchChange,
  onRefresh,
  onCreate,
  refreshing = false,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: MofaToolbarProps) {
  const monthOptions = getMonthOptions();

  return (
    <PageToolbar
      search={search}
      searchPlaceholder={searchPlaceholder}
      onSearchChange={onSearchChange}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Add MOFA"
    >
      {/* FILTER */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <SlidersHorizontal />
            Filter
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-72">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">View</p>
              <p className="text-xs text-muted-foreground">
                Select MOFA stage
              </p>
            </div>

            <Select
              value={filter.view}
              onValueChange={(value) =>
                onFilterChange({
                  ...filter,
                  view: value as MofaFilterState["view"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="medupdated">Med Updated</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
              </SelectContent>
            </Select>

            <Separator />

            <div>
              <p className="text-sm font-medium">Month</p>
              <p className="text-xs text-muted-foreground">
                Filter by application date
              </p>

              <div className="mt-2">
                <Select
                  value={filter.month}
                  onValueChange={(value) =>
                    onFilterChange({ ...filter, month: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* SORT */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            {sort.mode === "descending" ? <ArrowDownAZ /> : <ArrowUpAZ />}
            Sort
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-64">
          <div className="space-y-4">
            <p className="text-sm font-medium">Sort by</p>

            <Select
              value={sort.field}
              onValueChange={(value) =>
                onSortChange({
                  ...sort,
                  field: value as MofaSortState["field"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="created_at">Created date</SelectItem>
                <SelectItem value="name">Candidate name</SelectItem>
                <SelectItem value="passport_no">Passport number</SelectItem>
                <SelectItem value="application_number">
                  Application number
                </SelectItem>
                <SelectItem value="application_date">
                  Application date
                </SelectItem>
                <SelectItem value="updated_at">Updated date</SelectItem>
              </SelectContent>
            </Select>

            {/* ASC / DESC */}
            <div className="flex w-full gap-1">
              <Button
                type="button"
                variant={sort.mode === "descending" ? "outline" : "secondary"}
                className="flex-1"
                onClick={() => onSortChange({ ...sort, mode: "ascending" })}
              >
                <ArrowUpAZ />
                Asc
              </Button>

              <Button
                type="button"
                variant={sort.mode === "descending" ? "secondary" : "outline"}
                className="flex-1"
                onClick={() => onSortChange({ ...sort, mode: "descending" })}
              >
                <ArrowDownAZ />
                Desc
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* LIST */}
      <Button
        type="button"
        variant={viewMode === "list" ? "secondary" : "outline"}
        size="icon"
        onClick={() => onViewModeChange("list")}
      >
        <List />
        <span className="sr-only">List view</span>
      </Button>
    </PageToolbar>
  );
}
