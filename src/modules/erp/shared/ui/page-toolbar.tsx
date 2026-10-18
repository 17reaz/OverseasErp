// src/modules/erp/shared/ui/page-toolbar.tsx

import type { ReactNode } from "react";
import { Plus, RefreshCw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PageToolbarProps {
  /** LEFT — search */
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  /** MIDDLE — module-specific controls (filters, selects, tabs...) */
  children?: ReactNode;

  /** RIGHT — refresh + create */
  onRefresh?: () => void;
  refreshing?: boolean;

  onCreate?: () => void;
  createLabel?: string;
  createDisabled?: boolean;

  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Search field                                                              */
/* -------------------------------------------------------------------------- */

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-24 flex-1 sm:min-w-40">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full min-w-0 pl-9 pr-9"
      />

      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Toolbar                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Layout — always ONE line:
 *
 *   [ search ........ ] [ controls ] [refresh] [create]
 *
 * - The search field absorbs the free space and shrinks down to a minimum
 *   width, so it never collapses to nothing.
 * - Controls and action buttons never shrink, so they are never cut off
 *   or drawn over each other.
 * - If a screen is still too narrow for everything, the toolbar scrolls
 *   sideways instead of clipping or overlapping anything.
 */
export function PageToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",

  children,

  onRefresh,
  refreshing = false,

  onCreate,
  createLabel = "Create",
  createDisabled = false,

  className,
}: PageToolbarProps) {
  return (
    <div
      className={cn(
        "-mx-0.5 -my-0.5 flex w-full min-w-0 shrink-0 flex-nowrap items-center gap-2 overflow-x-auto px-0.5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
      />

      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}

      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw
              className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
          </Button>
        )}

        {onCreate && (
          <Button
            type="button"
            disabled={createDisabled}
            onClick={onCreate}
            className="h-9 shrink-0 px-3 sm:px-4"
            aria-label={createLabel}
            title={createLabel}
          >
            <Plus className="h-4 w-4 shrink-0 sm:mr-2" />

            <span className="hidden whitespace-nowrap sm:inline">
              {createLabel}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
