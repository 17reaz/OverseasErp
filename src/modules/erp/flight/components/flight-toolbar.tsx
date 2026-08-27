import { PageToolbar } from "../../shared/ui/page-toolbar";

interface FlightToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreate: () => void;
  refreshing?: boolean;
}

export function FlightToolbar({
  search,
  onSearchChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: FlightToolbarProps) {
  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search candidate, passport, flight no or airline..."
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create"
    />
  );
}
