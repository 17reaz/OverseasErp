// src/modules/erp/medical/components/medical-toolbar.tsx

import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Check,
  Grid2X2,
  List,
  SlidersHorizontal,
  Stethoscope,
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

import type { MedicalStatus } from "../medical-service";

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type MedicalFilterState = {
  view: MedicalStatus | "all" | "medicalable";
  month: "all" | string;
};

export type MedicalSortState = {
  mode: "ascending" | "descending" | "custom";
  field: "name" | "passport_no" | "medical_date" | "created_at" | "updated_at";
};

export type MedicalViewMode = "list" | "grid";

interface MedicalToolbarProps {
  search?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;

  onRefresh?: () => void;
  onCreate?: () => void;

  refreshing?: boolean;

  // FILTER

  filter?: MedicalFilterState;
  onFilterChange?: (filter: MedicalFilterState) => void;

  monthOptions?: Array<{ value: string; label: string }>;

  // SORT

  sort?: MedicalSortState;
  onSortChange?: (sort: MedicalSortState) => void;

  // VIEW

  viewMode?: MedicalViewMode;
  onViewModeChange?: (mode: MedicalViewMode) => void;
}

const defaultFilter: MedicalFilterState = {
  view: "all",
  month: "all",
};

const defaultSort: MedicalSortState = {
  mode: "custom",
  field: "created_at",
};

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
    const value = `${year}-${month}`;

    const label = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    months.push({ value, label });
  }

  return months;
}

export function MedicalToolbar({
  search = "",
  searchPlaceholder = "Search candidate or passport...",
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
}: MedicalToolbarProps) {
  const months = monthOptions ?? getDefaultMonthOptions();

  function updateFilter(changes: Partial<MedicalFilterState>) {
    onFilterChange?.({ ...filter, ...changes });
  }

  function updateSort(changes: Partial<MedicalSortState>) {
    onSortChange?.({ ...sort, ...changes });
  }

  const isMedicalable = filter.view === "medicalable";
  const statusValue = isMedicalable ? "all" : filter.view;

  // Medicalable + status are handled by their own controls.
  const activeFilterCount = [filter.month !== "all" ? "month" : null].filter(
    Boolean,
  ).length;

  const sortLabel =
    sort.mode === "ascending"
      ? "Ascending"
      : sort.mode === "descending"
        ? "Descending"
        : "Custom";

  const statusLabel =
    statusValue === "new"
      ? "New"
      : statusValue === "fit"
        ? "Fit"
        : statusValue === "unfit"
          ? "Unfit"
          : statusValue === "expired"
            ? "Expired"
            : "All";

  return (
    <PageToolbar
      search={search}
      searchPlaceholder={searchPlaceholder}
      onSearchChange={(value) => onSearchChange?.(value)}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Add Medical"
    >
      {/* ===================================================
          MEDICALABLE — standalone toggle
          =================================================== */}

      <Button
        type="button"
        variant={isMedicalable ? "secondary" : "outline"}
        className="h-9 shrink-0"
        onClick={() =>
          updateFilter({ view: isMedicalable ? "all" : "medicalable" })
        }
      >
        <Stethoscope className="mr-2 h-4 w-4" />

        <span className="hidden sm:inline">Medicalable</span>
      </Button>

      {/* ===================================================
          STATUS FILTER — ALL / NEW / FIT / UNFIT / EXPIRED
          =================================================== */}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" type="button" className="h-9 shrink-0">
            <SlidersHorizontal className="mr-2 h-4 w-4" />

            <span className="hidden sm:inline">{statusLabel}</span>

            <span className="sm:hidden">
              {statusValue === "all" ? "All" : statusLabel}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Medical status</DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuRadioGroup
            value={statusValue}
            onValueChange={(value) =>
              updateFilter({
                view: value as MedicalFilterState["view"],
              })
            }
          >
            <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="new">New</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="fit">Fit</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="unfit">Unfit</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="expired">
              Expired
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ===================================================
          MAIN FILTER
          Month
          =================================================== */}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" type="button" className="h-9 shrink-0">
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
          <DropdownMenuLabel>Filter medicals</DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* MONTH */}

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
                  <DropdownMenuRadioItem
                    key={month.value}
                    value={month.value}
                  >
                    {month.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuCheckboxItem
            checked={activeFilterCount === 0}
            onCheckedChange={() =>
              onFilterChange?.({
                ...filter,
                month: "all",
              })
            }
          >
            <Check className="mr-2 h-4 w-4" />
            Clear filters
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ===================================================
          SORT
          =================================================== */}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" type="button" className="h-9 shrink-0">
            <ArrowUpDown className="mr-2 h-4 w-4" />

            <span className="hidden sm:inline">Sort</span>

            <span className="ml-1 text-xs text-muted-foreground">
              · {sortLabel}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Sort medicals</DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuRadioGroup
            value={sort.mode}
            onValueChange={(value) =>
              updateSort({
                mode: value as MedicalSortState["mode"],
              })
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
                  updateSort({
                    field: value as MedicalSortState["field"],
                  })
                }
              >
                <DropdownMenuRadioItem value="name">
                  Candidate name
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem value="passport_no">
                  Passport number
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem value="medical_date">
                  Medical date
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem value="created_at">
                  Created date
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem value="updated_at">
                  Updated date
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ===================================================
          LIST / GRID TOGGLE
          =================================================== */}

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