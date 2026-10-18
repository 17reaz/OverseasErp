// src/modules/erp/candidates/components/candidate-toolbar.tsx

import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Check,
  Grid2X2,
  List,
  SlidersHorizontal,
  UserRoundPlus,
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
import type { CandidateDisplayStatus } from "../candidate-status";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface CandidateFilterState {
  status: CandidateDisplayStatus | "all";
  agentId: string;
  stage: string;
  month: string;
}

export type CandidateSortState = {
  mode: "ascending" | "descending" | "custom";
  field: "name" | "passport_no" | "created_at" | "updated_at";
};

export type ViewMode = "list" | "grid";

interface Option {
  value: string;
  label: string;
}

interface CandidateToolbarProps {
  search?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;

  onRefresh?: () => void;
  onCreate?: () => void;
  onCreateFullPage?: () => void;
  refreshing?: boolean;

  filter?: CandidateFilterState;
  onFilterChange?: (filter: CandidateFilterState) => void;
  agentOptions?: Option[];
  stageOptions?: string[];
  monthOptions?: Option[];

  sort?: CandidateSortState;
  onSortChange?: (sort: CandidateSortState) => void;

  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const defaultFilter: CandidateFilterState = {
  status: "all",
  agentId: "all",
  stage: "all",
  month: "all",
};

const defaultSort: CandidateSortState = {
  mode: "custom",
  field: "created_at",
};

const STATUS_OPTIONS: Option[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "returned", label: "Returned" },
  { value: "cancelled", label: "Cancelled" },
  { value: "complete", label: "Complete" },
];

const SORT_MODE_LABELS: Record<CandidateSortState["mode"], string> = {
  ascending: "Ascending",
  descending: "Descending",
  custom: "Custom",
};

const SORT_FIELD_OPTIONS: Option[] = [
  { value: "name", label: "Name" },
  { value: "passport_no", label: "Passport" },
  { value: "created_at", label: "Created date" },
  { value: "updated_at", label: "Updated date" },
];

/**
 * Responsive rules (the toolbar always stays on ONE line):
 *   below lg  → icon-only buttons
 *   lg        → short labels  (Status value, "Filter", "Sort")
 *   2xl       → long labels   ("Full Registration", sort mode, view names)
 */
const SHORT_LABEL = "hidden lg:inline";
const LONG_LABEL = "hidden 2xl:inline";

const MENU_CLASS = "max-w-[calc(100vw-1rem)]";

/* -------------------------------------------------------------------------- */
/*  Status filter                                                             */
/* -------------------------------------------------------------------------- */

function StatusFilter({
  value,
  onChange,
}: {
  value: CandidateFilterState["status"];
  onChange: (value: CandidateFilterState["status"]) => void;
}) {
  const label =
    STATUS_OPTIONS.find((option) => option.value === value)?.label ?? "All";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className="h-9 shrink-0 px-2.5 lg:px-4"
          aria-label={`Candidate status: ${label}`}
          title={`Status: ${label}`}
        >
          <SlidersHorizontal className="h-4 w-4 lg:mr-2" />

          <span className={SHORT_LABEL}>{label}</span>

          {value !== "all" && (
            <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary lg:hidden" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        collisionPadding={8}
        className={`w-48 ${MENU_CLASS}`}
      >
        <DropdownMenuLabel>Candidate status</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) =>
            onChange(next as CandidateFilterState["status"])
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
  );
}

/* -------------------------------------------------------------------------- */
/*  Main filter (Agent / Stage / Month)                                       */
/* -------------------------------------------------------------------------- */

function FilterSubmenu({
  title,
  allLabel,
  value,
  options,
  onChange,
}: {
  title: string;
  allLabel: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{title}</DropdownMenuSubTrigger>

      <DropdownMenuSubContent
        collisionPadding={8}
        className={`max-h-72 overflow-y-auto ${MENU_CLASS}`}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuRadioItem value="all">{allLabel}</DropdownMenuRadioItem>

          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function MainFilter({
  filter,
  activeCount,
  agentOptions,
  stageOptions,
  monthOptions,
  onChange,
  onClear,
}: {
  filter: CandidateFilterState;
  activeCount: number;
  agentOptions: Option[];
  stageOptions: string[];
  monthOptions: Option[];
  onChange: (changes: Partial<CandidateFilterState>) => void;
  onClear: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className="h-9 shrink-0 px-2.5 lg:px-4"
          aria-label="Filter candidates"
          title="Filter"
        >
          <SlidersHorizontal className="h-4 w-4 lg:mr-2" />

          <span className={SHORT_LABEL}>Filter</span>

          {activeCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground lg:ml-2">
              {activeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        collisionPadding={8}
        className={`w-64 ${MENU_CLASS}`}
      >
        <DropdownMenuLabel>Filter candidates</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <FilterSubmenu
          title="Agent"
          allLabel="All agents"
          value={filter.agentId}
          options={agentOptions}
          onChange={(agentId) => onChange({ agentId })}
        />

        <FilterSubmenu
          title="Stage"
          allLabel="All stages"
          value={filter.stage}
          options={stageOptions.map((stage) => ({
            value: stage,
            label: stage,
          }))}
          onChange={(stage) => onChange({ stage })}
        />

        <FilterSubmenu
          title="Month"
          allLabel="All months"
          value={filter.month}
          options={monthOptions}
          onChange={(month) => onChange({ month })}
        />

        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          checked={activeCount === 0}
          onCheckedChange={onClear}
        >
          <Check className="mr-2 h-4 w-4" />
          Clear filters
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sort                                                                      */
/* -------------------------------------------------------------------------- */

function SortMenu({
  sort,
  onChange,
}: {
  sort: CandidateSortState;
  onChange: (changes: Partial<CandidateSortState>) => void;
}) {
  const sortLabel = SORT_MODE_LABELS[sort.mode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className="h-9 shrink-0 px-2.5 lg:px-4"
          aria-label={`Sort candidates: ${sortLabel}`}
          title={`Sort: ${sortLabel}`}
        >
          <ArrowUpDown className="h-4 w-4 lg:mr-2" />

          <span className={SHORT_LABEL}>Sort</span>

          <span className={`ml-1 text-xs text-muted-foreground ${LONG_LABEL}`}>
            · {sortLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        collisionPadding={8}
        className={`w-56 ${MENU_CLASS}`}
      >
        <DropdownMenuLabel>Sort candidates</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup
          value={sort.mode}
          onValueChange={(mode) =>
            onChange({ mode: mode as CandidateSortState["mode"] })
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
              onValueChange={(field) =>
                onChange({ field: field as CandidateSortState["field"] })
              }
            >
              {SORT_FIELD_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/*  View toggle                                                               */
/* -------------------------------------------------------------------------- */

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange?: (mode: ViewMode) => void;
}) {
  const items = [
    { mode: "grid", label: "Workboard", Icon: Grid2X2 },
    { mode: "list", label: "Record", Icon: List },
  ] as const;

  return (
    <div className="inline-flex h-9 shrink-0 items-center rounded-md border bg-muted/30 p-0.5">
      {items.map(({ mode, label, Icon }) => (
        <Button
          key={mode}
          type="button"
          variant={value === mode ? "secondary" : "ghost"}
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          aria-label={label}
          aria-pressed={value === mode}
          title={label}
          onClick={() => onChange?.(mode)}
        >
          <Icon className="h-4 w-4" />
          <span className={LONG_LABEL}>{label}</span>
        </Button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Toolbar                                                                   */
/* -------------------------------------------------------------------------- */

export function CandidateToolbar({
  search = "",
  searchPlaceholder = "Search name, passport...",
  onSearchChange,

  onRefresh,
  onCreate,
  onCreateFullPage,
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

  function updateSort(changes: Partial<CandidateSortState>) {
    onSortChange?.({ ...sort, ...changes });
  }

  // Status intentionally excluded — it has its own dropdown.
  const activeFilterCount = [
    filter.agentId !== "all" ? "agent" : null,
    filter.stage !== "all" ? "stage" : null,
    filter.month !== "all" ? "month" : null,
  ].filter(Boolean).length;

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
      <Button
        type="button"
        variant="outline"
        className="h-9 shrink-0 px-2.5 2xl:px-4"
        onClick={onCreateFullPage}
        aria-label="Full Registration"
        title="Full Registration"
      >
        <UserRoundPlus className="h-4 w-4 2xl:mr-2" />
        <span className={LONG_LABEL}>Full Registration</span>
      </Button>

      <StatusFilter
        value={filter.status}
        onChange={(status) => updateFilter({ status })}
      />

      <MainFilter
        filter={filter}
        activeCount={activeFilterCount}
        agentOptions={agentOptions}
        stageOptions={stageOptions}
        monthOptions={monthOptions}
        onChange={updateFilter}
        onClear={() =>
          onFilterChange?.({
            ...filter,
            agentId: "all",
            stage: "all",
            month: "all",
          })
        }
      />

      <SortMenu sort={sort} onChange={updateSort} />

      <ViewToggle value={viewMode} onChange={onViewModeChange} />
    </PageToolbar>
  );
}
