import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { FingerStatus } from "../finger-service";
import { PageToolbar } from "../../shared/ui/page-toolbar";

export type FingerStatusFilter = "all" | FingerStatus;
export type FingerViewMode = "all" | "finger-able";

interface FingerToolbarProps {
  viewMode: FingerViewMode;
  onViewModeChange: (mode: FingerViewMode) => void;

  search: string;
  onSearchChange: (value: string) => void;

  status: FingerStatusFilter;
  onStatusChange: (value: FingerStatusFilter) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;
}

export function FingerToolbar({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  status,
  onStatusChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: FingerToolbarProps) {
  const statusLabel =
    status === "pending"
      ? "Pending"
      : status === "scheduled"
        ? "Scheduled"
        : status === "completed"
          ? "Completed"
          : status === "failed"
            ? "Failed"
            : status === "cancelled"
              ? "Cancelled"
              : "All Status";

  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={
        viewMode === "all"
          ? "Search candidate or passport..."
          : "Search candidate, passport or MOFA..."
      }
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create"
    >
      {/* View Switch */}
      <div className="flex shrink-0 items-center gap-1 rounded-md border p-1">
        <Button
          type="button"
          size="sm"
          variant={viewMode === "all" ? "secondary" : "ghost"}
          onClick={() => onViewModeChange("all")}
        >
          All Records
        </Button>

        <Button
          type="button"
          size="sm"
          variant={viewMode === "finger-able" ? "secondary" : "ghost"}
          onClick={() => onViewModeChange("finger-able")}
        >
          Finger-able
        </Button>
      </div>

      {/* Status Filter: only for All Records */}
      {viewMode === "all" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className="h-9 shrink-0"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />

              <span className="hidden sm:inline">
                {statusLabel}
              </span>

              <span className="sm:hidden">
                {status === "all" ? "All" : statusLabel}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Finger status</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuRadioGroup
              value={status}
              onValueChange={(value) =>
                onStatusChange(value as FingerStatusFilter)
              }
            >
              <DropdownMenuRadioItem value="all">
                All Status
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem value="pending">
                Pending
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem value="scheduled">
                Scheduled
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem value="completed">
                Completed
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem value="failed">
                Failed
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem value="cancelled">
                Cancelled
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </PageToolbar>
  );
}