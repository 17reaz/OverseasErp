// src/modules/erp/accounts/fixed-costs/components/fixed-costs-toolbar.tsx

import {
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FIXED_COST_FREQUENCY_OPTIONS,
  FIXED_COST_STATUS_OPTIONS,
  type FixedCostFrequencyFilter,
  type FixedCostStatusFilter,
} from "../fixed-costs-types";

const STATUS_FILTERS: {
  value: FixedCostStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  ...FIXED_COST_STATUS_OPTIONS,
];

interface FixedCostsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  statusFilter: FixedCostStatusFilter;
  onStatusFilterChange: (
    value: FixedCostStatusFilter,
  ) => void;

  frequencyFilter: FixedCostFrequencyFilter;
  onFrequencyFilterChange: (
    value: FixedCostFrequencyFilter,
  ) => void;

  categoryFilter: string;
  onCategoryFilterChange: (
    value: string,
  ) => void;

  categories: string[];

  refreshing: boolean;
  onRefresh: () => void;

  onCreate: () => void;
}

export function FixedCostsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  frequencyFilter,
  onFrequencyFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  refreshing,
  onRefresh,
  onCreate,
}: FixedCostsToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              onSearchChange(
                event.target.value,
              )
            }
            placeholder="Search by name, category or vendor..."
            className="h-9 pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={onCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Fixed Cost
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Status — segmented */}

        <div className="flex rounded-md border p-0.5">
          {STATUS_FILTERS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={
                statusFilter === option.value
                  ? "secondary"
                  : "ghost"
              }
              size="sm"
              className="h-7"
              onClick={() =>
                onStatusFilterChange(
                  option.value,
                )
              }
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Frequency */}

        <Select
          value={frequencyFilter}
          onValueChange={(value) =>
            onFrequencyFilterChange(
              value as FixedCostFrequencyFilter,
            )
          }
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All frequency
            </SelectItem>

            {FIXED_COST_FREQUENCY_OPTIONS.map(
              (option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        {/* Category */}

        <Select
          value={categoryFilter}
          onValueChange={
            onCategoryFilterChange
          }
        >
          <SelectTrigger className="h-9 w-[170px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All categories
            </SelectItem>

            {categories.map((category) => (
              <SelectItem
                key={category}
                value={category}
              >
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
