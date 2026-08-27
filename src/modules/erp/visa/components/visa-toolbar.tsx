import { PageToolbar } from "../../shared/ui/page-toolbar";

interface VisaToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreate: () => void;
  refreshing?: boolean;
}

export function VisaToolbar({
  search,
  onSearchChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: VisaToolbarProps) {
  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search candidate, passport or visa no..."
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create"
    />
  );
}
