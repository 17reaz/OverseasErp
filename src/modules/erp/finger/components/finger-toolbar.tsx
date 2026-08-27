import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { FingerStatus } from "../finger-service";

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type FingerStatusFilter = "all" | FingerStatus;

interface FingerToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  status: FingerStatusFilter;
  onStatusChange: (value: FingerStatusFilter) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;
}

export function FingerToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: FingerToolbarProps) {
  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search candidate or passport..."
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create"
    >
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as FingerStatusFilter)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </PageToolbar>
  );
}
