import { FileCheck2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type VisaFilterView = "all" | "visaable";

interface VisaToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreate: () => void;
  refreshing?: boolean;

  // VISAABLE

  view?: VisaFilterView;
  onViewChange?: (view: VisaFilterView) => void;
}

export function VisaToolbar({
  search,
  onSearchChange,
  onRefresh,
  onCreate,
  refreshing = false,

  view = "all",
  onViewChange,
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
          VISAABLE — standalone toggle
          =================================================== */}

      <Button
        type="button"
        variant={isVisaable ? "secondary" : "outline"}
        className="h-9 shrink-0"
        onClick={() =>
          onViewChange?.(isVisaable ? "all" : "visaable")
        }
      >
        <FileCheck2 className="mr-2 h-4 w-4" />

        <span className="hidden sm:inline">Visaable</span>
      </Button>
    </PageToolbar>
  );
}
