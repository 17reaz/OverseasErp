// src/modules/erp/agents/components/agents-toolbar.tsx

import { PageToolbar } from "../../shared/ui/page-toolbar";

interface AgentsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;
  createDisabled?: boolean;
}

export function AgentsToolbar({
  search,
  onSearchChange,
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
    />
  );
}
