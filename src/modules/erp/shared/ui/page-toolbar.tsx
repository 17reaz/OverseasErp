// src/modules/erp/shared/ui/page-toolbar.tsx
//
// Universal ERP page toolbar.
//
// Layout contract (used by every module page):
//   LEFT    -> search input (always the same)
//   MIDDLE  -> module-specific controls (filters, sort, view toggle, ...)
//              passed in as `children`
//   RIGHT   -> refresh (optional) + create/"add new" action (optional)
//
// Each module keeps its own <XyzToolbar /> component for its own filter/
// sort UI and types, but that component renders <PageToolbar> for the
// actual shell instead of re-implementing search/refresh/create markup.

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
        "flex shrink-0 flex-wrap items-center gap-2",
        className,
      )}
    >
      {/* =================================================
          LEFT — SEARCH
          ================================================= */}

      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="pr-9 pl-9"
        />

        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* =================================================
          MIDDLE — PER-PAGE CONTROLS (filters, sort, view...)
          ================================================= */}

      {children}

      {/* =================================================
          RIGHT — REFRESH
          ================================================= */}

      {onRefresh && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh"
        >
          <RefreshCw
            className={
              refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"
            }
          />
        </Button>
      )}

      {/* =================================================
          RIGHT — CREATE / ADD NEW
          ================================================= */}

      {onCreate && (
        <Button type="button" onClick={onCreate} disabled={createDisabled}>
          <Plus className="mr-2 h-4 w-4" />
          {createLabel}
        </Button>
      )}
    </div>
  );
}
