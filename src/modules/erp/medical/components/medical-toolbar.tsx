import {
  ArrowDownAZ,
  ArrowUpAZ,
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
  Separator,
} from "@/components/ui/separator";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

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

import {
  type MedicalStatus,
} from "../medical-service";


export type MedicalFilterState = {
  view:
    | MedicalStatus
    | "all"
    | "medicalable";

  month:
    | "all"
    | string;
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

  search: string;

  searchPlaceholder?: string;

  onSearchChange: (
    value: string,
  ) => void;

  onRefresh: () => void;

  onCreate: () => void;

  refreshing?: boolean;

  filter: MedicalFilterState;

  onFilterChange: (
    filter: MedicalFilterState,
  ) => void;

  sort: MedicalSortState;

  onSortChange: (
    sort: MedicalSortState,
  ) => void;

  viewMode: MedicalViewMode;

  onViewModeChange: (
    mode: MedicalViewMode,
  ) => void;
}


export function MedicalToolbar({
  search,
  searchPlaceholder =
    "Search candidate or passport...",
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
}: MedicalToolbarProps) {

  return (
    <div
      className="
        flex
        flex-col
        gap-3
        md:flex-row
        md:items-center
        md:justify-between
      "
    >

      {/* Search */}

      <div
        className="
          relative
          w-full
          md:max-w-sm
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
          onChange={(
            event,
          ) =>
            onSearchChange(
              event.target.value,
            )
          }
          placeholder={
            searchPlaceholder
          }
          className="
            pl-9
          "
        />

      </div>


      {/* Actions */}

      <div
        className="
          flex
          items-center
          gap-2
          overflow-x-auto
        "
      >

        {/* Filter */}

        <Popover>

          <PopoverTrigger
            asChild
          >

            <Button
              variant="outline"
              size="sm"
            >
              <SlidersHorizontal />
              Filter
            </Button>

          </PopoverTrigger>


          <PopoverContent
            align="end"
            className="w-72"
          >

            <div
              className="
                space-y-4
              "
            >

              <div>
                <p
                  className="
                    text-sm
                    font-medium
                  "
                >
                  View
                </p>

                <p
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >
                  Select medical stage
                </p>
              </div>


              <Select
                value={
                  filter.view
                }
                onValueChange={(
                  value,
                ) =>
                  onFilterChange({
                    ...filter,
                    view:
                      value as MedicalFilterState["view"],
                  })
                }
              >

                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>


                <SelectContent>

                  <SelectItem
                    value="medicalable"
                  >
                    Medicalable
                  </SelectItem>

                  <SelectItem
                    value="all"
                  >
                    All
                  </SelectItem>

                  <SelectItem
                    value="new"
                  >
                    New
                  </SelectItem>

                  <SelectItem
                    value="fit"
                  >
                    Fit
                  </SelectItem>

                  <SelectItem
                    value="unfit"
                  >
                    Unfit
                  </SelectItem>

                  <SelectItem
                    value="expired"
                  >
                    Expired
                  </SelectItem>

                </SelectContent>

              </Select>


              <Separator />


              <div>
                <p
                  className="
                    text-sm
                    font-medium
                  "
                >
                  Month
                </p>

                <Select
                  value={
                    filter.month
                  }
                  onValueChange={(
                    value,
                  ) =>
                    onFilterChange({
                      ...filter,
                      month: value,
                    })
                  }
                >

                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem
                      value="all"
                    >
                      All months
                    </SelectItem>

                  </SelectContent>

                </Select>

              </div>

            </div>

          </PopoverContent>

        </Popover>


        {/* Sort */}

        <Popover>

          <PopoverTrigger
            asChild
          >

            <Button
              variant="outline"
              size="sm"
            >
              {sort.mode ===
              "descending" ? (
                <ArrowDownAZ />
              ) : (
                <ArrowUpAZ />
              )}

              Sort
            </Button>

          </PopoverTrigger>


          <PopoverContent
            align="end"
            className="w-64"
          >

            <div
              className="
                space-y-4
              "
            >

              <div>
                <p
                  className="
                    text-sm
                    font-medium
                  "
                >
                  Sort by
                </p>
              </div>


              <Select
                value={
                  sort.field
                }
                onValueChange={(
                  value,
                ) =>
                  onSortChange({
                    ...sort,
                    field:
                      value as MedicalSortState["field"],
                  })
                }
              >

                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem
                    value="created_at"
                  >
                    Created date
                  </SelectItem>

                  <SelectItem
                    value="name"
                  >
                    Candidate name
                  </SelectItem>

                  <SelectItem
                    value="passport_no"
                  >
                    Passport number
                  </SelectItem>

                  <SelectItem
                    value="medical_date"
                  >
                    Medical date
                  </SelectItem>

                  <SelectItem
                    value="updated_at"
                  >
                    Updated date
                  </SelectItem>

                </SelectContent>

              </Select>


              <ToggleGroup
                type="single"
                value={
                  sort.mode ===
                  "descending"
                    ? "descending"
                    : "ascending"
                }
                onValueChange={(
                  value,
                ) => {

                  if (!value) {
                    return;
                  }

                  onSortChange({
                    ...sort,
                    mode:
                      value as MedicalSortState["mode"],
                  });

                }}
                className="w-full"
              >

                <ToggleGroupItem
                  value="ascending"
                  className="flex-1"
                >
                  <ArrowUpAZ />
                  Asc
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="descending"
                  className="flex-1"
                >
                  <ArrowDownAZ />
                  Desc
                </ToggleGroupItem>

              </ToggleGroup>

            </div>

          </PopoverContent>

        </Popover>


        {/* Refresh */}

        <Button
          variant="outline"
          size="icon"
          onClick={
            onRefresh
          }
          disabled={
            refreshing
          }
        >
          <RefreshCw
            className={
              refreshing
                ? "animate-spin"
                : undefined
            }
          />
        </Button>


        {/* View */}

        <ToggleGroup
          type="single"
          value={
            viewMode
          }
          onValueChange={(
            value,
          ) => {

            if (!value) {
              return;
            }

            onViewModeChange(
              value as MedicalViewMode,
            );

          }}
        >

          <ToggleGroupItem
            value="list"
            aria-label="List view"
          >
            <List />
          </ToggleGroupItem>

        </ToggleGroup>


        {/* Create */}

        <Button
          onClick={
            onCreate
          }
        >
          <Plus />
          Add Medical
        </Button>

      </div>

    </div>
  );
}