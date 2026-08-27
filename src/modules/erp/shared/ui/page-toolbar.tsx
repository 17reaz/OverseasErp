// src/modules/erp/shared/ui/page-toolbar.tsx

import type { ReactNode } from "react";

import {
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PageToolbarProps {
  // ===================================================
  // LEFT — SEARCH
  // ===================================================

  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // ===================================================
  // MIDDLE — MODULE-SPECIFIC CONTROLS
  // ===================================================

  children?: ReactNode;

  // ===================================================
  // RIGHT — REFRESH + CREATE
  // ===================================================

  onRefresh?: () => void;
  refreshing?: boolean;

  onCreate?: () => void;
  createLabel?: string;
  createDisabled?: boolean;

  className?: string;
}

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
        `
          flex
          w-full
          min-w-0
          shrink-0
          items-center
          gap-2
        `,
        className,
      )}
    >
      {/* =================================================
          LEFT — SEARCH
          ================================================= */}

      <div
        className="
          relative
          min-w-0
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
            onSearchChange(event.target.value)
          }
          placeholder={searchPlaceholder}
          className="
            h-9
            w-full
            pl-9
            pr-9
          "
        />

        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="
              absolute
              right-1
              top-1/2
              h-7
              w-7
              -translate-y-1/2
            "
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* =================================================
          MIDDLE — PAGE SPECIFIC CONTROLS
          ================================================= */}

      {children && (
        <div
          className="
            flex
            shrink-0
            items-center
            gap-2
          "
        >
          {children}
        </div>
      )}

      {/* =================================================
          RIGHT — ACTIONS
          NEVER WRAPS
          ================================================= */}

      <div
        className="
          flex
          shrink-0
          items-center
          gap-1
          md:gap-2
        "
      >
        {/* =================================================
            REFRESH
            ================================================= */}

        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="
              h-9
              w-9
              shrink-0
            "
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh"
          >
            <RefreshCw
              className={
                refreshing
                  ? "h-4 w-4 animate-spin"
                  : "h-4 w-4"
              }
            />
          </Button>
        )}

        {/* =================================================
            ADD NEW
            ================================================= */}

        {onCreate && (
          <Button
            type="button"
            disabled={createDisabled}
            onClick={onCreate}
            className="
              h-9
              shrink-0
              px-3
              sm:px-4
            "
            aria-label={createLabel}
          >
            <Plus
              className="
                h-4
                w-4
                shrink-0
                sm:mr-2
              "
            />

            <span
              className="
                hidden
                whitespace-nowrap
                sm:inline
              "
            >
              {createLabel}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
