import {
  Plus,
  RefreshCw,
  Search,
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


export type AgencyFilterState = {
  status:
    | "all"
    | "active"
    | "inactive";
};


export type AgencySortState = {
  field:
    | "sl"
    | "name"
    | "code"
    | "created_at"
    | "updated_at";

  mode:
    | "ascending"
    | "descending";
};


interface AgencyToolbarProps {

  search: string;

  onSearchChange: (
    value: string,
  ) => void;

  searchPlaceholder?: string;

  filter: AgencyFilterState;

  onFilterChange: (
    filter: AgencyFilterState,
  ) => void;

  sort: AgencySortState;

  onSortChange: (
    sort: AgencySortState,
  ) => void;

  onRefresh: () => void;

  onCreate: () => void;

  refreshing?: boolean;
}


export function AgencyToolbar({
  search,
  onSearchChange,
  searchPlaceholder =
    "Search agency...",
  filter,
  onFilterChange,
  sort,
  onSortChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: AgencyToolbarProps) {

  return (
    <div
      className="
        flex
        flex-col
        gap-3
        rounded-lg
        border
        bg-background
        p-3
        lg:flex-row
        lg:items-center
        lg:justify-between
      "
    >

      {/* ==================================================
          LEFT
          ================================================== */}

      <div
        className="
          flex
          min-w-0
          flex-1
          flex-col
          gap-2
          sm:flex-row
          sm:items-center
        "
      >

        {/* SEARCH */}

        <div
          className="
            relative
            w-full
            sm:max-w-sm
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


        <Separator
          orientation="vertical"
          className="
            hidden
            h-6
            sm:block
          "
        />


        {/* STATUS */}

        <select
          value={filter.status}
          onChange={(event) =>
            onFilterChange({
              ...filter,
              status:
                event.target
                  .value as AgencyFilterState["status"],
            })
          }
          className="
            h-9
            rounded-md
            border
            bg-background
            px-3
            text-sm
            outline-none
            focus:ring-2
            focus:ring-ring
          "
          aria-label="Filter agencies"
        >

          <option value="all">
            All
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>

        </select>


        {/* SORT */}

        <select
          value={sort.field}
          onChange={(event) =>
            onSortChange({
              ...sort,
              field:
                event.target
                  .value as AgencySortState["field"],
            })
          }
          className="
            h-9
            rounded-md
            border
            bg-background
            px-3
            text-sm
            outline-none
            focus:ring-2
            focus:ring-ring
          "
          aria-label="Sort agencies"
        >

          <option value="sl">
            SL
          </option>

          <option value="name">
            Name
          </option>

          <option value="code">
            Code
          </option>

          <option value="created_at">
            Created
          </option>

          <option value="updated_at">
            Updated
          </option>

        </select>


        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onSortChange({
              ...sort,
              mode:
                sort.mode ===
                "ascending"
                  ? "descending"
                  : "ascending",
            })
          }
        >
          {sort.mode ===
          "ascending"
            ? "Ascending"
            : "Descending"}
        </Button>

      </div>


      {/* ==================================================
          RIGHT
          ================================================== */}

      <div
        className="
          flex
          shrink-0
          items-center
          gap-2
        "
      >

        {/* REFRESH */}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh"
        >

          <RefreshCw
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          <span
            className="sr-only"
          >
            Refresh agencies
          </span>

        </Button>


        {/* CREATE */}

        <Button
          type="button"
          onClick={onCreate}
        >

          <Plus />

          Create Agency

        </Button>

      </div>

    </div>
  );
}