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

interface FingerToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  status: FingerStatusFilter;
  onStatusChange: (value: FingerStatusFilter) => void;

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
      searchPlaceholder="Search candidate or passport..."
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create"
    >
      {/* ===================================================
          STATUS FILTER
          =================================================== */}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" type="button" className="h-9 shrink-0">
            <SlidersHorizontal className="mr-2 h-4 w-4" />

            <span className="hidden sm:inline">{statusLabel}</span>

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
    </PageToolbar>
  );
}