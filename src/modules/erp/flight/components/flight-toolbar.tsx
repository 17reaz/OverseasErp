import { Plane, PlaneTakeoff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageToolbar } from "../../shared/ui/page-toolbar";

interface FlightToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreate: () => void;

  flightAbleMode: boolean;
  onFlightAbleToggle: () => void;

  refreshing?: boolean;
}

export function FlightToolbar({
  search,
  onSearchChange,
  onRefresh,
  onCreate,
  flightAbleMode,
  onFlightAbleToggle,
  refreshing = false,
}: FlightToolbarProps) {
  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={
        flightAbleMode
          ? "Search candidate, passport or visa..."
          : "Search candidate, passport, flight no or airline..."
      }
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create"
    >
      <Button
        variant={flightAbleMode ? "default" : "outline"}
        type="button"
        className="h-9 shrink-0"
        onClick={onFlightAbleToggle}
        aria-pressed={flightAbleMode}
      >
        <PlaneTakeoff className="mr-2 h-4 w-4" />
        Flight-able
      </Button>
    </PageToolbar>
  );
}