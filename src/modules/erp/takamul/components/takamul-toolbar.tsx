import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type ResultFilter = "all" | "pending" | "pass" | "fail";

interface TradeTestToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  resultFilter: ResultFilter;
  onResultFilterChange: (value: ResultFilter) => void;
  onRefresh: () => void;
  onCreate: () => void;
  refreshing?: boolean;
}

export function TradeTestToolbar({
  search,
  onSearchChange,
  resultFilter,
  onResultFilterChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: TradeTestToolbarProps) {
  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search candidate, passport or center..."
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel="Create"
    >
      <Select
        value={resultFilter}
        onValueChange={(val) => onResultFilterChange(val as ResultFilter)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Result Filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Results</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="pass">Pass</SelectItem>
          <SelectItem value="fail">Fail</SelectItem>
        </SelectContent>
      </Select>
    </PageToolbar>
  );
}
