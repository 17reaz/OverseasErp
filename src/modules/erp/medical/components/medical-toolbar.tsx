import {
  ArrowDownAZ,
  ArrowUpAZ,
  List,
  SlidersHorizontal,
  Stethoscope,
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
  search: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;

  filter: MedicalFilterState;
  onFilterChange: (filter: MedicalFilterState) => void;

  sort: MedicalSortState;
  onSortChange: (sort: MedicalSortState) => void;

  viewMode: MedicalViewMode;
  onViewModeChange: (mode: MedicalViewMode) => void;
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

export function MedicalToolbar({
  search,
  searchPlaceholder = "Search candidate or passport...",
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
  const monthOptions = getMonthOptions();
  const isMedicalable = filter.view === "medicalable";

  return (
    <PageToolbar
      search={search}
      searchPlaceholder={searchPlaceholder}
      onSearchChange={onSearchChange}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Add Medical"
    >
      {/* MEDICALABLE TOGGLE (separate from filter popover) */}
      <Button
        type="button"
        variant={isMedicalable ? "secondary" : "outline"}
        size="sm"
        onClick={() =>
          onFilterChange({
            ...filter,
            view: isMedicalable ? "all" : "medicalable",
          })
        }
      >
        <Stethoscope />
        Medicalable
      </Button>

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
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">
                Select medical stage
              </p>

              <div className="mt-2">
                <Select
                  value={isMedicalable ? "all" : filter.view}
                  onValueChange={(value: string) =>
                    onFilterChange({
                      ...filter,
                      view: value as MedicalFilterState["view"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="fit">Fit</SelectItem>
                    <SelectItem value="unfit">Unfit</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium">Month</p>
              <p className="text-xs text-muted-foreground">
                Filter by medical date
              </p>

              <div className="mt-2">
                <Select
                  value={filter.month}
                  onValueChange={(value: string) =>
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
              onValueChange={(value: string) =>
                onSortChange({
                  ...sort,
                  field: value as MedicalSortState["field"],
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
                <SelectItem value="medical_date">Medical date</SelectItem>
                <SelectItem value="updated_at">Updated date</SelectItem>
              </SelectContent>
            </Select>

            {/* Asc / Desc */}
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

      {/* LIST VIEW */}
      <Button
        type="button"
        variant={viewMode === "list" ? "secondary" : "outline"}
        size="icon"
        onClick={() => onViewModeChange("list")}
      >
        <List />
      </Button>
    </PageToolbar>
  );
}