// src/modules/erp/finance/components/finance-kpi.tsx

import {
  ArrowDownRight,
  ArrowUpRight,
  HandCoins,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { formatCurrency } from "../finance-utils";
import type { FinanceSummary } from "../finance-types";

interface FinanceKpiProps {
  summary: FinanceSummary | null;
  loading?: boolean;
}

interface KpiCardConfig {
  key: string;
  label: string;
  value: number;
  icon: typeof Wallet;
  tone: "default" | "positive" | "negative" | "warning";
}

export function FinanceKpi({ summary, loading = false }: FinanceKpiProps) {
  const cards: KpiCardConfig[] = [
    {
      key: "balance",
      label: "Total Balance",
      value: summary?.totalBalance ?? 0,
      icon: Wallet,
      tone: "default",
    },
    {
      key: "income",
      label: "Total Income",
      value: summary?.totalIncome ?? 0,
      icon: ArrowUpRight,
      tone: "positive",
    },
    {
      key: "expense",
      label: "Total Expense",
      value: summary?.totalExpense ?? 0,
      icon: ArrowDownRight,
      tone: "negative",
    },
    {
      key: "receivables",
      label: "Outstanding Receivables",
      value: summary?.outstandingReceivables ?? 0,
      icon: HandCoins,
      tone: "warning",
    },
    {
      key: "payables",
      label: "Outstanding Payables",
      value: summary?.outstandingPayables ?? 0,
      icon: ReceiptText,
      tone: "warning",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.key} size="sm">
          <CardContent className="flex flex-col gap-2 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>

              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  card.tone === "positive" &&
                    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                  card.tone === "negative" &&
                    "bg-destructive/15 text-destructive",
                  card.tone === "warning" &&
                    "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                  card.tone === "default" && "bg-primary/10 text-primary",
                )}
              >
                <card.icon className="h-3.5 w-3.5" />
              </span>
            </div>

            {loading ? (
              <div className="h-6 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <span className="text-lg font-semibold tracking-tight">
                {formatCurrency(card.value)}
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
