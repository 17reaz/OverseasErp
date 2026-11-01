
import { Grid2X2, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageToolbar } from "../../shared/ui/page-toolbar";

export type AgentViewMode = "list" | "grid";

interface AgentsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  viewMode: AgentViewMode;
  onViewModeChange: (mode: AgentViewMode) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;
  createDisabled?: boolean;
}

function ViewToggle({
  value,
  onChange,
}: {
  value: AgentViewMode;
  onChange: (mode: AgentViewMode) => void;
}) {
  return (
    <div className="inline-flex h-9 shrink-0 items-center rounded-md border bg-muted/30 p-0.5">
      <Button
        type="button"
        variant={value === "list" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 gap-1.5 px-2.5"
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={value === "list"}
        title="List view"
      >
        <List className="h-4 w-4" />
        <span className="hidden 2xl:inline">List</span>
      </Button>

      <Button
        type="button"
        variant={value === "grid" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 gap-1.5 px-2.5"
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        title="Grid view"
      >
        <Grid2X2 className="h-4 w-4" />
        <span className="hidden 2xl:inline">Grid</span>
      </Button>
    </div>
  );
}

export function AgentsToolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  onCreate,
  refreshing = false,
  createDisabled = false,
}: AgentsToolbarProps) {
  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search agent name or code..."
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Add Agent"
      createDisabled={createDisabled}
    >
      <ViewToggle value={viewMode} onChange={onViewModeChange} />
    </PageToolbar>
  );
}
