// src/modules/erp/finance/components/finance-toolbar.tsx

import type { ReactNode } from "react";

import { PageToolbar } from "../../shared/ui/page-toolbar";

interface FinanceToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  onRefresh?: () => void;
  refreshing?: boolean;

  onCreate?: () => void;
  createLabel?: string;

  children?: ReactNode;
}

export function FinanceToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  onRefresh,
  refreshing = false,
  onCreate,
  createLabel = "Create",
  children,
}: FinanceToolbarProps) {
  return (
    <PageToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onCreate={onCreate}
      createLabel={createLabel}
    >
      {children}
    </PageToolbar>
  );
}
