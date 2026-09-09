// src/modules/erp/finance/components/finance-overview.tsx

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { FinanceKpi } from "./finance-kpi";
import { FinanceAccountList } from "./finance-account-list";

import {
  getAccounts,
  getFinanceSummary,
  getPayables,
  getReceivables,
  getTransactions,
} from "../finance-service";

import { formatCurrency, formatDate, isOverdue } from "../finance-utils";

import type {
  FinanceAccount,
  FinancePayable,
  FinanceReceivable,
  FinanceSummary,
  FinanceTransaction,
} from "../finance-types";

/* =========================================================
   MINI BAR CHART (no chart library needed for a dummy view)
========================================================= */

function MonthlyCashflowChart({
  summary,
}: {
  summary: FinanceSummary | null;
}) {
  const points = summary?.monthly ?? [];
  const max = Math.max(1, ...points.map((p) => Math.max(p.income, p.expense)));

  return (
    <Card>
      <CardContent className="px-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium">Income vs Expense</h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Income
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-destructive" /> Expense
            </span>
          </div>
        </div>

        <div className="flex h-40 items-end gap-3">
          {points.map((point) => (
            <div
              key={point.label}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <div className="flex h-32 w-full items-end justify-center gap-1">
                <div
                  className="w-1/2 max-w-4 rounded-t bg-emerald-500/80"
                  style={{
                    height: `${Math.max((point.income / max) * 100, 2)}%`,
                  }}
                  title={formatCurrency(point.income)}
                />
                <div
                  className="w-1/2 max-w-4 rounded-t bg-destructive/70"
                  style={{
                    height: `${Math.max((point.expense / max) * 100, 2)}%`,
                  }}
                  title={formatCurrency(point.expense)}
                />
              </div>

              <span className="text-xs text-muted-foreground">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   RECENT TRANSACTIONS
========================================================= */

function RecentTransactions({
  transactions,
  accounts,
}: {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];
}) {
  function accountName(id: string) {
    return accounts.find((a) => a.id === id)?.name ?? "Unknown";
  }

  return (
    <Card>
      <CardContent className="px-4">
        <h3 className="mb-2 text-sm font-medium">Recent Transactions</h3>

        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No transactions yet.
          </p>
        ) : (
          <div className="divide-y">
            {transactions.slice(0, 6).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.date)} · {accountName(transaction.accountId)}
                  </p>
                </div>

                <span
                  className={
                    transaction.type === "income"
                      ? "shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                      : "shrink-0 text-sm font-semibold text-destructive"
                  }
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* =========================================================
   DUE SOON
========================================================= */

function DueSoon({
  payables,
  receivables,
}: {
  payables: FinancePayable[];
  receivables: FinanceReceivable[];
}) {
  const openPayables = payables
    .filter((p) => p.status !== "paid")
    .slice(0, 4);

  const openReceivables = receivables
    .filter((r) => r.status !== "received")
    .slice(0, 4);

  return (
    <Card>
      <CardContent className="space-y-4 px-4">
        <h3 className="text-sm font-medium">Due Soon</h3>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Payables
          </p>

          {openPayables.length === 0 ? (
            <p className="text-xs text-muted-foreground">All settled.</p>
          ) : (
            <div className="space-y-1.5">
              {openPayables.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {isOverdue(p.dueDate) && (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    )}
                    <span className="truncate">{p.vendor}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(p.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Receivables
          </p>

          {openReceivables.length === 0 ? (
            <p className="text-xs text-muted-foreground">All collected.</p>
          ) : (
            <div className="space-y-1.5">
              {openReceivables.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {isOverdue(r.dueDate) && (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    )}
                    <span className="truncate">{r.from}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(r.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   OVERVIEW PAGE
========================================================= */

export function FinanceOverview() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [payables, setPayables] = useState<FinancePayable[]>([]);
  const [receivables, setReceivables] = useState<FinanceReceivable[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [
        summaryData,
        accountsData,
        transactionsData,
        payablesData,
        receivablesData,
      ] = await Promise.all([
        getFinanceSummary(),
        getAccounts(),
        getTransactions(),
        getPayables(),
        getReceivables(),
      ]);

      setSummary(summaryData);
      setAccounts(accountsData);
      setTransactions(transactionsData);
      setPayables(payablesData);
      setReceivables(receivablesData);
    } catch (error) {
      console.error("Failed to load finance overview:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="space-y-4">
      <FinanceKpi summary={summary} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyCashflowChart summary={summary} />
        </div>

        <FinanceAccountList accounts={accounts} loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions} accounts={accounts} />
        </div>

        <DueSoon payables={payables} receivables={receivables} />
      </div>
    </div>
  );
}
