import {
  RefreshCw,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  type MofaStage,
} from "../mofa-service";


export type MofaFilterState = {
  stage: MofaStage | "all";
};


export type MofaSortField =
  | "sl"
  | "application_number"
  | "application_date"
  | "candidate"
  | "trade"
  | "created_at";


export type MofaSortMode =
  | "ascending"
  | "descending";


export type MofaSortState = {
  field: MofaSortField;
  mode: MofaSortMode;
};


interface MofaToolbarProps {
  search: string;

  searchPlaceholder?: string;

  onSearchChange: (
    value: string,
  ) => void;

  filter: MofaFilterState;

  onFilterChange: (
    filter: MofaFilterState,
  ) => void;

  sort: MofaSortState;

  onSortChange: (
    sort: MofaSortState,
  ) => void;

  onRefresh: () => void;

  onCreate: () => void;

  refreshing?: boolean;
}


export function MofaToolbar({
  search,
  searchPlaceholder =
    "Search candidate, passport or application...",
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: MofaToolbarProps) {

  function toggleSort(
    field: MofaSortField,
  ) {

    if (
      sort.field !== field
    ) {

      onSortChange({
        field,
        mode: "ascending",
      });

      return;
    }


    onSortChange({
      field,
      mode:
        sort.mode ===
        "ascending"
          ? "descending"
          : "ascending",
    });

  }


  return (
    <div
      className="
        flex
        flex-col
        gap-3
      "
    >

      {/* ==================================================
          TITLE + ACTIONS
          ================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-3
        "
      >

        <div>

          <h1
            className="
              text-lg
              font-semibold
            "
          >
            MOFA
          </h1>


          <p
            className="
              text-sm
              text-muted-foreground
            "
          >
            Manage MOFA applications
          </p>

        </div>


        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
          >

            <RefreshCw
              className={
                `
                mr-2
                h-4
                w-4
                ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }
                `
              }
            />

            Refresh

          </Button>


          <Button
            size="sm"
            type="button"
            onClick={onCreate}
          >

            <Plus
              className="
                mr-2
                h-4
                w-4
              "
            />

            Create

          </Button>

        </div>

      </div>


      {/* ==================================================
          TOOLBAR
          ================================================== */}

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-2
        "
      >

        {/* ==================================================
            SEARCH
            ================================================== */}

        <div
          className="
            relative
            min-w-[260px]
            flex-1
          "
        >

          <Search
            className="
              pointer-events-none
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


        {/* ==================================================
            FILTER
            ================================================== */}

        <div
          className="
            flex
            items-center
            gap-1
            rounded-md
            border
            p-1
          "
        >

          <SlidersHorizontal
            className="
              mx-2
              h-4
              w-4
              text-muted-foreground
            "
          />


          <Button
            type="button"
            size="sm"
            variant={
              filter.stage ===
              "all"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              onFilterChange({
                stage: "all",
              })
            }
          >
            All
          </Button>


          <Button
            type="button"
            size="sm"
            variant={
              filter.stage ===
              "new"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              onFilterChange({
                stage: "new",
              })
            }
          >
            New
          </Button>


          <Button
            type="button"
            size="sm"
            variant={
              filter.stage ===
              "medupdated"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              onFilterChange({
                stage: "medupdated",
              })
            }
          >
            Medical Updated
          </Button>


          <Button
            type="button"
            size="sm"
            variant={
              filter.stage ===
              "approved"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              onFilterChange({
                stage: "approved",
              })
            }
          >
            Approved
          </Button>


          <Button
            type="button"
            size="sm"
            variant={
              filter.stage ===
              "canceled"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              onFilterChange({
                stage: "canceled",
              })
            }
          >
            Canceled
          </Button>


          <Button
            type="button"
            size="sm"
            variant={
              filter.stage ===
              "expired"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              onFilterChange({
                stage: "expired",
              })
            }
          >
            Expired
          </Button>


          <Button
            type="button"
            size="sm"
            variant={
              filter.stage ===
              "invalid"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              onFilterChange({
                stage: "invalid",
              })
            }
          >
            Invalid
          </Button>

        </div>


        {/* ==================================================
            SORT
            ================================================== */}

        <div
          className="
            flex
            items-center
            gap-1
            rounded-md
            border
            p-1
          "
        >

          <ArrowUpDown
            className="
              mx-2
              h-4
              w-4
              text-muted-foreground
            "
          />


          <Button
            type="button"
            size="sm"
            variant={
              sort.field ===
              "sl"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              toggleSort("sl")
            }
          >
            SL
          </Button>


          <Button
            type="button"
            size="sm"
            variant={
              sort.field ===
              "application_date"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              toggleSort(
                "application_date",
              )
            }
          >
            Date
          </Button>


          <Button
            type="button"
            size="sm"
            variant={
              sort.field ===
              "candidate"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              toggleSort(
                "candidate",
              )
            }
          >
            Candidate
          </Button>


          <Button
            type="button"
            size="sm"
            variant={
              sort.field ===
              "trade"
                ? "secondary"
                : "ghost"
            }
            onClick={() =>
              toggleSort("trade")
            }
          >
            Trade
          </Button>

        </div>

      </div>

    </div>
  );
}