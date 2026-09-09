// src/modules/erp/finance/components/finance-account-list.tsx

import { Banknote, Building2, Smartphone } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { formatCurrency } from "../finance-utils";
import { ACCOUNT_TYPE_LABELS } from "../finance-constants";
import type { FinanceAccount } from "../finance-types";

interface FinanceAccountListProps {
  accounts: FinanceAccount[];
  loading?: boolean;
}

const ACCOUNT_ICONS = {
  bank: Building2,
  cash: Banknote,
  mobile_banking: Smartphone,
} as const;

export function FinanceAccountList({
  accounts,
  loading = false,
}: FinanceAccountListProps) {
  return (
    <Card>
      <CardContent className="space-y-1 px-4">
        <h3 className="mb-2 text-sm font-medium">Accounts</h3>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No accounts yet.
          </p>
        ) : (
          <div className="divide-y">
            {accounts.map((account) => {
              const Icon = ACCOUNT_ICONS[account.type];

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {account.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ACCOUNT_TYPE_LABELS[account.type]}
                        {account.accountNumber
                          ? ` · ${account.accountNumber}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-semibold">
                    {formatCurrency(account.balance, account.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
