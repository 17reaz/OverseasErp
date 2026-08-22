import {
  Plus,
  RefreshCw,
  Search,
  X,
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

import type {
  FingerStatus,
} from "../finger-service";

export type FingerStatusFilter =
  | "all"
  | FingerStatus;

interface FingerToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  status: FingerStatusFilter;
  onStatusChange: (
    value: FingerStatusFilter,
  ) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;
}

export function FingerToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: FingerToolbarProps) {
  function handleClearSearch() {
    onSearchChange("");
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search candidate or passport..."
          className="pr-9 pl-9"
        />

        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Status */}
      <Select
        value={status}
        onValueChange={(value) =>
          onStatusChange(
            value as FingerStatusFilter,
          )
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            All Status
          </SelectItem>

          <SelectItem value="pending">
            Pending
          </SelectItem>

          <SelectItem value="scheduled">
            Scheduled
          </SelectItem>

          <SelectItem value="completed">
            Completed
          </SelectItem>

          <SelectItem value="failed">
            Failed
          </SelectItem>

          <SelectItem value="cancelled">
            Cancelled
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Refresh */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh finger records"
      >
        <RefreshCw
          className={`h-4 w-4 ${
            refreshing ? "animate-spin" : ""
          }`}
        />
      </Button>

      {/* Create */}
      <Button
        type="button"
        onClick={onCreate}
      >
        <Plus className="mr-2 h-4 w-4" />
        Create
      </Button>
    </div>
  );
}