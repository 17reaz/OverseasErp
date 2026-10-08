import {
  FileCheck2,
  Grid2X2,
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type VisaFilterView = "all" | "visaable";
export type VisaDisplayView = "list" | "grid";

interface VisaToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreate: () => void;
  refreshing?: boolean;

  // VISAABLE
  view?: VisaFilterView;
  onViewChange?: (view: VisaFilterView) => void;

  // DISPLAY
  displayView?: VisaDisplayView;
  onDisplayViewChange?: (view: VisaDisplayView) => void;
}

export function VisaToolbar({
  search,
  onSearchChange,
  onRefresh,
  onCreate,
  refreshing = false,

  view = "all",
  onViewChange,

  displayView = "list",
  onDisplayViewChange,
}: VisaToolbarProps) {
  const isVisaable = view === "visaable";

  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search candidate, passport or visa no..."
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create"
    >
      {/* ===================================================
          VIEW MODE — LIST / GRID
          =================================================== */}

      <div className="flex h-9 shrink-0 items-center rounded-lg border bg-muted/40 p-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={
            displayView === "list"
              ? "h-8 rounded-md bg-background px-2.5 shadow-sm"
              : "h-8 rounded-md px-2.5 text-muted-foreground hover:bg-background/60"
          }
          onClick={() => onDisplayViewChange?.("list")}
          aria-label="List view"
        >
          <List className="h-4 w-4" />

          <span className="ml-1.5 hidden sm:inline">
            List
          </span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={
            displayView === "grid"
              ? "h-8 rounded-md bg-background px-2.5 shadow-sm"
              : "h-8 rounded-md px-2.5 text-muted-foreground hover:bg-background/60"
          }
          onClick={() => onDisplayViewChange?.("grid")}
          aria-label="Grid view"
        >
          <Grid2X2 className="h-4 w-4" />

          <span className="ml-1.5 hidden sm:inline">
            Grid
          </span>
        </Button>
      </div>

      {/* ===================================================
          VISAABLE — standalone toggle
          =================================================== */}

      <Button
        type="button"
        variant={isVisaable ? "secondary" : "outline"}
        className="h-9 shrink-0"
        onClick={() =>
          onViewChange?.(
            isVisaable ? "all" : "visaable",
          )
        }
      >
        <FileCheck2 className="mr-2 h-4 w-4" />

        <span className="hidden sm:inline">
          Visaable
        </span>
      </Button>
    </PageToolbar>
  );
}