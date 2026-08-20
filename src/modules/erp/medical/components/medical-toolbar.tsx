import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Check,
  List,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

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

export type MedicalView =
  | "medicalable"
  | "new"
  | "fit"
  | "unfit"
  | "expired"
  | "all";

export type MedicalFilterState = {
  view: MedicalView;
  month: string;
};

export type MedicalSortState = {
  mode:
    | "ascending"
    | "descending"
    | "custom";

  field:
    | "name"
    | "passport_no"
    | "medical_date"
    | "created_at"
    | "updated_at";
};

export type MedicalViewMode =
  | "list"
  | "grid";

interface MedicalToolbarProps {
  search?: string;

  searchPlaceholder?: string;

  onSearchChange?: (
    value: string,
  ) => void;

  onRefresh?: () => void;

  onCreate?: () => void;

  refreshing?: boolean;

  filter?: MedicalFilterState;

  onFilterChange?: (
    filter: MedicalFilterState,
  ) => void;

  monthOptions?: Array<{
    value: string;
    label: string;
  }>;

  sort?: MedicalSortState;

  onSortChange?: (
    sort: MedicalSortState,
  ) => void;

  viewMode?: MedicalViewMode;

  onViewModeChange?: (
    mode: MedicalViewMode,
  ) => void;
}

const defaultFilter: MedicalFilterState = {
  view: "medicalable",
  month: "all",
};

const defaultSort: MedicalSortState = {
  mode: "custom",
  field: "created_at",
};

export function MedicalToolbar({
  search = "",
  searchPlaceholder = "Search candidate or passport...",
  onSearchChange,
  onRefresh,
  onCreate,
  refreshing = false,
  filter = defaultFilter,
  onFilterChange,
  monthOptions = [],
  sort = defaultSort,
  onSortChange,
  viewMode = "list",
  onViewModeChange,
}: MedicalToolbarProps) {

  function updateFilter(
    changes: Partial<MedicalFilterState>,
  ) {
    onFilterChange?.({
      ...filter,
      ...changes,
    });
  }

  function updateSort(
    changes: Partial<MedicalSortState>,
  ) {
    onSortChange?.({
      ...sort,
      ...changes,
    });
  }

  const activeFilterCount =
    [
      filter.view !==
      "medicalable"
        ? "view"
        : null,

      filter.month !==
      "all"
        ? "month"
        : null,
    ].filter(Boolean).length;

  const sortLabel =
    sort.mode ===
    "ascending"
      ? "Ascending"
      : sort.mode ===
          "descending"
        ? "Descending"
        : "Custom";

  return (
    <div
      className="
        flex
        w-full
        items-center
        justify-between
        gap-4
        border-b
        bg-background
        px-4
        py-3
        md:px-6
      "
    >

      {/* =================================================
          LEFT — SEARCH
          ================================================= */}

      <div
        className="
          relative
          w-full
          max-w-[320px]
          shrink-0
        "
      >

        <Search
          className="
            absolute
            left-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-muted-foreground
          "
        />

        <Input
          value={search}
          onChange={(event) =>
            onSearchChange?.(
              event.target.value,
            )
          }
          placeholder={
            searchPlaceholder
          }
          className="
            h-9
            pl-9
          "
        />

      </div>


      {/* =================================================
          RIGHT — ACTIONS
          ================================================= */}

      <div
        className="
          ml-auto
          flex
          shrink-0
          items-center
          gap-2
        "
      >

        {/* =================================================
            FILTER
            ================================================= */}

        <DropdownMenu>

          <DropdownMenuTrigger
            asChild
          >

            <Button
              variant="outline"
              type="button"
              className="
                h-9
              "
            >

              <SlidersHorizontal
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Filter

              {activeFilterCount >
                0 && (
                <span
                  className="
                    ml-2
                    inline-flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-primary
                    px-1.5
                    text-[10px]
                    font-semibold
                    text-primary-foreground
                  "
                >
                  {
                    activeFilterCount
                  }
                </span>
              )}

            </Button>

          </DropdownMenuTrigger>


          <DropdownMenuContent
            align="start"
            className="
              w-64
            "
          >

            <DropdownMenuLabel>
              Filter medical
            </DropdownMenuLabel>

            <DropdownMenuSeparator />


            {/* =================================================
                VIEW
                ================================================= */}

            <DropdownMenuLabel
              className="
                text-xs
                font-normal
                text-muted-foreground
              "
            >
              View
            </DropdownMenuLabel>

            <DropdownMenuRadioGroup
              value={
                filter.view
              }
              onValueChange={(
                value,
              ) =>
                updateFilter({
                  view:
                    value as MedicalView,
                })
              }
            >

              <DropdownMenuRadioItem
                value="medicalable"
              >
                Medicalable
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem
                value="new"
              >
                New
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem
                value="fit"
              >
                Fit
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem
                value="unfit"
              >
                Unfit
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem
                value="expired"
              >
                Expired
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem
                value="all"
              >
                All
              </DropdownMenuRadioItem>

            </DropdownMenuRadioGroup>


            <DropdownMenuSeparator />


            {/* =================================================
                MONTH
                ================================================= */}

            <DropdownMenuSub>

              <DropdownMenuSubTrigger>
                Month
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent>

                <DropdownMenuRadioGroup
                  value={
                    filter.month
                  }
                  onValueChange={(
                    value,
                  ) =>
                    updateFilter({
                      month:
                        value,
                    })
                  }
                >

                  <DropdownMenuRadioItem
                    value="all"
                  >
                    All months
                  </DropdownMenuRadioItem>

                  {monthOptions.map(
                    (month) => (
                      <DropdownMenuRadioItem
                        key={
                          month.value
                        }
                        value={
                          month.value
                        }
                      >
                        {
                          month.label
                        }
                      </DropdownMenuRadioItem>
                    ),
                  )}

                </DropdownMenuRadioGroup>

              </DropdownMenuSubContent>

            </DropdownMenuSub>


            <DropdownMenuSeparator />


            {/* =================================================
                CLEAR FILTERS
                ================================================= */}

            <DropdownMenuCheckboxItem
              checked={
                filter.view ===
                  "medicalable" &&
                filter.month ===
                  "all"
              }
              onCheckedChange={() => {

                onFilterChange?.({
                  ...defaultFilter,
                });

              }}
            >

              <Check
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Clear filters

            </DropdownMenuCheckboxItem>

          </DropdownMenuContent>

        </DropdownMenu>


        {/* =================================================
            SORT
            ================================================= */}

        <DropdownMenu>

          <DropdownMenuTrigger
            asChild
          >

            <Button
              variant="outline"
              type="button"
              className="
                h-9
              "
            >

              <ArrowUpDown
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Sort

              <span
                className="
                  ml-1
                  text-xs
                  text-muted-foreground
                "
              >
                · {sortLabel}
              </span>

            </Button>

          </DropdownMenuTrigger>


          <DropdownMenuContent
            align="start"
            className="
              w-56
            "
          >

            <DropdownMenuLabel>
              Sort medical
            </DropdownMenuLabel>

            <DropdownMenuSeparator />


            <DropdownMenuRadioGroup
              value={
                sort.mode
              }
              onValueChange={(
                value,
              ) =>
                updateSort({
                  mode:
                    value as MedicalSortState["mode"],
                })
              }
            >

              <DropdownMenuRadioItem
                value="ascending"
              >

                <ArrowUpAZ
                  className="
                    mr-2
                    h-4
                    w-4
                  "
                />

                Ascending

              </DropdownMenuRadioItem>


              <DropdownMenuRadioItem
                value="descending"
              >

                <ArrowDownAZ
                  className="
                    mr-2
                    h-4
                    w-4
                  "
                />

                Descending

              </DropdownMenuRadioItem>


              <DropdownMenuRadioItem
                value="custom"
              >

                <SlidersHorizontal
                  className="
                    mr-2
                    h-4
                    w-4
                  "
                />

                Custom

              </DropdownMenuRadioItem>

            </DropdownMenuRadioGroup>


            {/* =================================================
                CUSTOM SORT
                ================================================= */}

            {sort.mode ===
              "custom" && (
              <>

                <DropdownMenuSeparator />

                <DropdownMenuLabel
                  className="
                    text-xs
                    font-normal
                    text-muted-foreground
                  "
                >
                  Sort by
                </DropdownMenuLabel>

                <DropdownMenuRadioGroup
                  value={
                    sort.field
                  }
                  onValueChange={(
                    value,
                  ) =>
                    updateSort({
                      field:
                        value as MedicalSortState["field"],
                    })
                  }
                >

                  <DropdownMenuRadioItem
                    value="name"
                  >
                    Candidate name
                  </DropdownMenuRadioItem>

                  <DropdownMenuRadioItem
                    value="passport_no"
                  >
                    Passport
                  </DropdownMenuRadioItem>

                  <DropdownMenuRadioItem
                    value="medical_date"
                  >
                    Medical date
                  </DropdownMenuRadioItem>

                  <DropdownMenuRadioItem
                    value="created_at"
                  >
                    Created date
                  </DropdownMenuRadioItem>

                  <DropdownMenuRadioItem
                    value="updated_at"
                  >
                    Updated date
                  </DropdownMenuRadioItem>

                </DropdownMenuRadioGroup>

              </>
            )}

          </DropdownMenuContent>

        </DropdownMenu>


        {/* =================================================
            REFRESH
            ================================================= */}

        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={
            onRefresh
          }
          disabled={
            refreshing
          }
          title="Refresh"
          className="
            h-9
            w-9
          "
        >

          <RefreshCw
            className={
              refreshing
                ? "h-4 w-4 animate-spin"
                : "h-4 w-4"
            }
          />

        </Button>


        {/* =================================================
            LIST / GRID
            ================================================= */}

        <div
          className="
            inline-flex
            h-9
            items-center
            rounded-md
            border
            bg-muted/30
            p-0.5
          "
        >

          <Button
            type="button"
            variant={
              viewMode ===
              "list"
                ? "secondary"
                : "ghost"
            }
            size="sm"
            className="
              h-8
              gap-1.5
              px-2.5
            "
            onClick={() =>
              onViewModeChange?.(
                "list",
              )
            }
          >

            <List
              className="
                h-4
                w-4
              "
            />

            <span
              className="
                hidden
                sm:inline
              "
            >
              List
            </span>

          </Button>

        </div>


        {/* =================================================
            CREATE
            ================================================= */}

        <Button
          type="button"
          className="
            h-9
          "
          onClick={
            onCreate
          }
        >

          <Plus
            className="
              mr-2
              h-4
              w-4
            "
          />

          Add Medical

        </Button>

      </div>

    </div>
  );
}