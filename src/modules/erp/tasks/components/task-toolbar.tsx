import {
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

type TaskToolbarProps = {
  search: string;
  onSearchChange: (
    value: string,
  ) => void;

  onRefresh: () => void;
  onCreate: () => void;

  loading?: boolean;
};

export function TaskToolbar({
  search,
  onSearchChange,
  onRefresh,
  onCreate,
  loading = false,
}: TaskToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(event) =>
            onSearchChange(
              event.target.value,
            )
          }
          placeholder="Search tasks..."
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw
            className={
              loading
                ? "h-4 w-4 animate-spin"
                : "h-4 w-4"
            }
          />
        </Button>

        <Button
          onClick={onCreate}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>
    </div>
  );
}