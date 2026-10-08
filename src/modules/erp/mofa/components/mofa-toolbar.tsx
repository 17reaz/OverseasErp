// src/modules/erp/mofa/components/mofa-toolbar.tsx

import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Check,
  FileCheck2,
  Grid2X2,
  List,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { MofaStage } from "../mofa-service";

import { PageToolbar } from "../../shared/ui/page-toolbar";

/* =========================================================
 * TYPES
 * ========================================================= */

export type MofaFilterState = {
  view: MofaStage | "all" | "mofaable";
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
  search?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;

  onRefresh?: () => void;
  onCreate?: () => void;

  refreshing?: boolean;

  // Filter
  filter?: MofaFilterState;
  onFilterChange?: (filter: MofaFilterState) => void;
  monthOptions?: Array<{ value: string; label: string }>;

  // Sort
  sort?: MofaSortState;
  onSortChange?: (sort: MofaSortState) => void;

  // View
  viewMode?: MofaViewMode;
  onViewModeChange?: (mode: MofaViewMode) => void;
}

/* =========================================================
 * CONSTANTS
 * ========================================================= */

const defaultFilter: MofaFilterState = {
  view: "all",
  month: "all",
};

const defaultSort: MofaSortState = {
  mode: "custom",
  field: "created_at",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "medupdated", label: "Med Updated" },
  { value: "approved", label: "Approved" },
  { value: "canceled", label: "Canceled" },
  { value: "expired", label: "Expired" },
  { value: "invalid", label: "Invalid" },
];

/** Labels shown on the status button. Anything else falls back to "All". */
const STATUS_BUTTON_LABELS: Record<string, string> = {
  new: "New",
  medupdated: "Med Updated",
  approved: "Approved",
};

const SORT_MODE_LABELS: Record<MofaSortState["mode"], string> = {
  ascending: "Ascending",
  descending: "Descending",
  custom: "Custom",
};

const SORT_FIELD_OPTIONS: Array<{
  value: MofaSortState["field"];
  label: string;
}> = [
  { value: "name", label: "Candidate name" },
  { value: "passport_no", label: "Passport number" },
  { value: "application_number", label: "Application number" },
  { value: "application_date", label: "Application date" },
  { value: "created_at", label: "Created date" },
  { value: "updated_at", label: "Updated date" },
];

const TRIGGER_BUTTON_CLASS = "h-9 shrink-0";

/* =========================================================
 * HELPERS
 * ========================================================= */

function getDefaultMonthOptions() {
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

    months.push({
      value: `${year}-${month}`,
      label: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    });
  }

  return months;
}

/* =========================================================
 * TOOLBAR
 * ========================================================= */

export function MofaToolbar({
  search = "",
  searchPlaceholder = "Search candidate, passport or application...",
  onSearchChange,

  onRefresh,
  onCreate,

  refreshing = false,

  filter = defaultFilter,
  onFilterChange,

  monthOptions,

  sort = defaultSort,
  onSortChange,

  viewMode = "list",
  onViewModeChange,
}: MofaToolbarProps) {
  const months = monthOptions ?? getDefaultMonthOptions();

  function updateFilter(changes: Partial<MofaFilterState>) {
    onFilterChange?.({ ...filter, ...changes });
  }

  function updateSort(changes: Partial<MofaSortState>) {
    onSortChange?.({ ...sort, ...changes });
  }

  const isMofaable = filter.view === "mofaable";
  const statusValue = isMofaable ? "all" : filter.view;
  const statusLabel = STATUS_BUTTON_LABELS[statusValue] ?? "All";

  // Mofaable + status are handled by their own controls.
  const activeFilterCount = filter.month !== "all" ? 1 : 0;

  const sortLabel = SORT_MODE_LABELS[sort.mode];

  return (
    <PageToolbar
      search={search}
      searchPlaceholder={searchPlaceholder}
      onSearchChange={(value) => onSearchChange?.(value)}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Add MOFA"
    >
      {/* MOFAABLE — standalone toggle */}
      <Button
        type="button"
        variant={isMofaable ? "secondary" : "outline"}
        className={TRIGGER_BUTTON_CLASS}
        onClick={() => updateFilter({ view: isMofaable ? "all" : "mofaable" })}
      >
        <FileCheck2 className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Mofaable</span>
      </Button>

      {/* STATUS FILTER */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className={TRIGGER_BUTTON_CLASS}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{statusLabel}</span>
            <span className="sm:hidden">{statusLabel}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>MOFA status</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuRadioGroup
            value={statusValue}
            onValueChange={(value) =>
              updateFilter({ view: value as MofaFilterState["view"] })
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* MAIN FILTER — Month */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className={TRIGGER_BUTTON_CLASS}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>

            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Filter MOFA</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Month</DropdownMenuSubTrigger>

            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={filter.month}
                onValueChange={(value) => updateFilter({ month: value })}
              >
                <DropdownMenuRadioItem value="all">
                  All months
                </DropdownMenuRadioItem>

                {months.map((month) => (
                  <DropdownMenuRadioItem key={month.value} value={month.value}>
                    {month.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuCheckboxItem
            checked={activeFilterCount === 0}
            onCheckedChange={() => updateFilter({ month: "all" })}
          >
            <Check className="mr-2 h-4 w-4" />
            Clear filters
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* SORT */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className={TRIGGER_BUTTON_CLASS}
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Sort</span>
            <span className="ml-1 text-xs text-muted-foreground">
              · {sortLabel}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Sort MOFA</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuRadioGroup
            value={sort.mode}
            onValueChange={(value) =>
              updateSort({ mode: value as MofaSortState["mode"] })
            }
          >
            <DropdownMenuRadioItem value="ascending">
              <ArrowUpAZ className="mr-2 h-4 w-4" />
              Ascending
            </DropdownMenuRadioItem>

            <DropdownMenuRadioItem value="descending">
              <ArrowDownAZ className="mr-2 h-4 w-4" />
              Descending
            </DropdownMenuRadioItem>

            <DropdownMenuRadioItem value="custom">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Custom
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          {sort.mode === "custom" && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Sort by
              </DropdownMenuLabel>

              <DropdownMenuRadioGroup
                value={sort.field}
                onValueChange={(value) =>
                  updateSort({ field: value as MofaSortState["field"] })
                }
              >
                {SORT_FIELD_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* LIST / GRID TOGGLE */}
      <div className="inline-flex h-9 shrink-0 items-center rounded-md border bg-muted/30 p-0.5">
        <Button
          type="button"
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          onClick={() => onViewModeChange?.("list")}
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">List</span>
        </Button>

        <Button
          type="button"
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          onClick={() => onViewModeChange?.("grid")}
        >
          <Grid2X2 className="h-4 w-4" />
          <span className="hidden sm:inline">Grid</span>
        </Button>
      </div>
    </PageToolbar>
  );
}
