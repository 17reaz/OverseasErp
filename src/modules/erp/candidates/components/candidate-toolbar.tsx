// src/modules/erp/candidates/components/candidate-toolbar.tsx

import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Check,
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

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type CandidateFilterState = {
  status: "all" | "active" | "returned";
  agentId: string;
  stage: string;
  month: string;
};

export type CandidateSortState = {
  mode: "ascending" | "descending" | "custom";
  field: "name" | "passport_no" | "created_at" | "updated_at";
};

export type ViewMode = "list" | "grid";

interface CandidateToolbarProps {
  search?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;

  onRefresh?: () => void;
  onCreate?: () => void;

  refreshing?: boolean;

  // FILTER

  filter?: CandidateFilterState;
  onFilterChange?: (filter: CandidateFilterState) => void;

  agentOptions?: Array<{ value: string; label: string }>;
  stageOptions?: string[];
  monthOptions?: Array<{ value: string; label: string }>;

  // SORT

  sort?: CandidateSortState;
  onSortChange?: (sort: CandidateSortState) => void;

  // VIEW

  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

const defaultFilter: CandidateFilterState = {
  status: "active",
  agentId: "all",
  stage: "all",
  month: "all",
};

const defaultSort: CandidateSortState = {
  mode: "custom",
  field: "created_at",
};

export function CandidateToolbar({
  search = "",
  searchPlaceholder = "Search name, passport...",
  onSearchChange,

  onRefresh,
  onCreate,

  refreshing = false,

  filter = defaultFilter,
  onFilterChange,

  agentOptions = [],
  stageOptions = [],
  monthOptions = [],

  sort = defaultSort,
  onSortChange,

  viewMode = "list",
  onViewModeChange,
}: CandidateToolbarProps) {
  function updateFilter(changes: Partial<CandidateFilterState>) {
    onFilterChange?.({ ...filter, ...changes });
  }

  const activeFilterCount = [
    filter.status !== "all" ? "status" : null,
    filter.agentId !== "all" ? "agent" : null,
    filter.stage !== "all" ? "stage" : null,
    filter.month !== "all" ? "month" : null,
  ].filter(Boolean).length;

  function updateSort(changes: Partial<CandidateSortState>) {
    onSortChange?.({ ...sort, ...changes });
  }

  const sortLabel =
    sort.mode === "ascending"
      ? "Ascending"
      : sort.mode === "descending"
        ? "Descending"
        : "Custom";

  return (
    <PageToolbar
      search={search}
      searchPlaceholder={searchPlaceholder}
      onSearchChange={(value) => onSearchChange?.(value)}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create"
    >
      {/* ===================================================
          FILTER
          =================================================== */}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" type="button" className="h-9">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Filter candidates</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Status
          </DropdownMenuLabel>

          <DropdownMenuRadioGroup
            value={filter.status}
            onValueChange={(value) =>
              updateFilter({
                status: value as CandidateFilterState["status"],
              })
            }
          >
            <DropdownMenuRadioItem value="active">
              Active
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="returned">
              Returned
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Agent</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={filter.agentId}
                onValueChange={(value) => updateFilter({ agentId: value })}
              >
                <DropdownMenuRadioItem value="all">
                  All agents
                </DropdownMenuRadioItem>
                {agentOptions.map((agent) => (
                  <DropdownMenuRadioItem key={agent.value} value={agent.value}>
                    {agent.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Stage</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={filter.stage}
                onValueChange={(value) => updateFilter({ stage: value })}
              >
                <DropdownMenuRadioItem value="all">
                  All stages
                </DropdownMenuRadioItem>
                {stageOptions.map((stage) => (
                  <DropdownMenuRadioItem key={stage} value={stage}>
                    {stage}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

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
                {monthOptions.map((month) => (
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
            onCheckedChange={() => onFilterChange?.({ ...defaultFilter })}
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
          <Button variant="outline" type="button" className="h-9">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
            <span className="ml-1 text-xs text-muted-foreground">
              · {sortLabel}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Sort candidates</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuRadioGroup
            value={sort.mode}
            onValueChange={(value) =>
              updateSort({ mode: value as CandidateSortState["mode"] })
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
                  updateSort({ field: value as CandidateSortState["field"] })
                }
              >
                <DropdownMenuRadioItem value="name">
                  Name
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="passport_no">
                  Passport
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

      <div className="inline-flex h-9 items-center rounded-md border bg-muted/30 p-0.5">
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
