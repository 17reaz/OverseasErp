
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageToolbar } from "../../shared/ui/page-toolbar";

export type VerificationFilter = "all" | "verified" | "unverified";
export type PoliceClearanceView = "all" | "pc-able";

interface PoliceClearanceToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  view: PoliceClearanceView;
  onViewChange: (value: PoliceClearanceView) => void;
  pcAbleCount: number;
  verificationFilter: VerificationFilter;
  onVerificationFilterChange: (value: VerificationFilter) => void;
  onRefresh: () => void;
  onCreate: () => void;
  refreshing?: boolean;
}

export function PoliceClearanceToolbar({
  search,
  onSearchChange,
  view,
  onViewChange,
  pcAbleCount,
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
      <Button
        type="button"
        size="sm"
        variant={view === "pc-able" ? "default" : "outline"}
        onClick={() =>
          onViewChange(view === "pc-able" ? "all" : "pc-able")
        }
      >
        PC Able ({pcAbleCount})
      </Button>

      {view === "all" && (
        <Select
          value={verificationFilter}
          onValueChange={(value) =>
            onVerificationFilterChange(value as VerificationFilter)
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Pending</SelectItem>
          </SelectContent>
        </Select>
      )}
    </PageToolbar>
  );
}
