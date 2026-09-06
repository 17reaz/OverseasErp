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

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type BmetStatusFilter =
  | "all"
  | "pending"
  | "complete";

interface BmetToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  status: BmetStatusFilter;
  onStatusChange: (
    value: BmetStatusFilter,
  ) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;
}

export function BmetToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: BmetToolbarProps) {
  const statusLabel =
    status === "pending"
      ? "Pending"
      : status === "complete"
        ? "Complete"
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
              {status === "all"
                ? "All"
                : statusLabel}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-48"
        >
          <DropdownMenuLabel>
            BMET status
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuRadioGroup
            value={status}
            onValueChange={(value) =>
              onStatusChange(
                value as BmetStatusFilter,
              )
            }
          >
            <DropdownMenuRadioItem value="all">
              All Status
            </DropdownMenuRadioItem>

            <DropdownMenuRadioItem value="pending">
              Pending
            </DropdownMenuRadioItem>

            <DropdownMenuRadioItem value="complete">
              Complete
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </PageToolbar>
  );
}