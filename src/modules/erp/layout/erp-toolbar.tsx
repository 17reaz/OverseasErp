import {
  RefreshCw,
  Search,
  SlidersHorizontal,
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

interface ErpToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;

  onRefresh?: () => void;
  refreshing?: boolean;

  filterValue?: string;
  onFilterChange?: (value: string) => void;

  filterOptions?: {
    label: string;
    value: string;
  }[];

  placeholder?: string;
}

export function ErpToolbar({
  search = "",
  onSearchChange,
  onRefresh,
  refreshing = false,
  filterValue,
  onFilterChange,
  filterOptions = [],
  placeholder = "Search...",
}: ErpToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b bg-background px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(event) =>
            onSearchChange?.(event.target.value)
          }
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Filter */}
        {filterOptions.length > 0 && (
          <Select
            value={filterValue}
            onValueChange={onFilterChange}
          >
            <SelectTrigger className="w-[150px]">
              <SlidersHorizontal className="mr-2 h-4 w-4" />

              <SelectValue placeholder="Filter" />
            </SelectTrigger>

            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Refresh */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw
            className={
              refreshing
                ? "h-4 w-4 animate-spin"
                : "h-4 w-4"
            }
          />
        </Button>
      </div>
    </div>
  );
}