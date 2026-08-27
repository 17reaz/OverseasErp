import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PageToolbar } from "../../shared/ui/page-toolbar";

export type VerificationFilter = "all" | "verified" | "unverified";

interface PoliceClearanceToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  verificationFilter: VerificationFilter;
  onVerificationFilterChange: (value: VerificationFilter) => void;

  onRefresh: () => void;
  onCreate: () => void;

  refreshing?: boolean;
}

export function PoliceClearanceToolbar({
  search,
  onSearchChange,
  verificationFilter,
  onVerificationFilterChange,
  onRefresh,
  onCreate,
  refreshing = false,
}: PoliceClearanceToolbarProps) {
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
        value={verificationFilter}
        onValueChange={(value) =>
          onVerificationFilterChange(value as VerificationFilter)
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Verification" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="unverified">Pending</SelectItem>
        </SelectContent>
      </Select>
    </PageToolbar>
  );
}
