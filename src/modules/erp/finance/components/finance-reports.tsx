// src/modules/erp/finance/components/finance-reports.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  getExpenses,
  getInvoices,
  getTransactions,
} from "../finance-service";

import { exportToCsv, formatCurrency, formatDate } from "../finance-utils";

import type {
  FinanceExpense,
  FinanceInvoice,
  FinanceTransaction,
} from "../finance-types";

/* =========================================================
   CATEGORY BREAKDOWN
========================================================= */

function CategoryBreakdown({
  title,
  data,
}: {
  title: string;
  data: { category: string; total: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <Card>
      <CardContent className="px-4">
        <h3 className="mb-3 text-sm font-medium">{title}</h3>

        {data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((row) => (
              <div key={row.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="truncate">{row.category}</span>
                  <span className="shrink-0 font-medium">
                    {formatCurrency(row.total)}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max((row.total / max) * 100, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* =========================================================
   REPORTS PAGE
========================================================= */

export function FinanceReports() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [transactionsData, expensesData, invoicesData] =
        await Promise.all([getTransactions(), getExpenses(), getInvoices()]);

      setTransactions(transactionsData);
      setExpenses(expensesData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const expenseByCategory = useMemo(() => {
    const totals = new Map<string, number>();

    expenses.forEach((expense) => {
      totals.set(
        expense.category,
        (totals.get(expense.category) ?? 0) + expense.amount,
      );
    });

    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const incomeByCategory = useMemo(() => {
    const totals = new Map<string, number>();

    transactions
      .filter((t) => t.type === "income")
      .forEach((t) => {
        totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
      });

    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  function handleExportTransactions() {
    exportToCsv(
      "transactions.csv",
      transactions.map((t) => ({
        date: t.date,
        type: t.type,
        category: t.category,
        description: t.description,
        reference: t.reference ?? "",
        amount: t.amount,
        status: t.status,
      })),
    );
  }

  function handleExportExpenses() {
    exportToCsv(
      "expenses.csv",
      expenses.map((e) => ({
        date: e.date,
        category: e.category,
        vendor: e.vendor,
        description: e.description ?? "",
        amount: e.amount,
        paymentMethod: e.paymentMethod,
        status: e.status,
      })),
    );
  }

  function handleExportInvoices() {
    exportToCsv(
      "invoices.csv",
      invoices.map((i) => ({
        invoiceNo: i.invoiceNo,
        billTo: i.billTo,
        agent: i.agent ?? "",
        issueDate: i.issueDate,
        dueDate: i.dueDate,
        amount: i.amount,
        paidAmount: i.paidAmount,
        status: i.status,
      })),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading report data..." : `Based on ${transactions.length} transactions`}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportTransactions}>
            <Download className="mr-2 h-3.5 w-3.5" /> Transactions
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExpenses}>
            <Download className="mr-2 h-3.5 w-3.5" /> Expenses
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportInvoices}>
            <Download className="mr-2 h-3.5 w-3.5" /> Invoices
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBreakdown title="Expenses by Category" data={expenseByCategory} />
        <CategoryBreakdown title="Income by Category" data={incomeByCategory} />
      </div>

      <Card>
        <CardContent className="px-4">
          <h3 className="mb-2 text-sm font-medium">Overdue Invoices</h3>

          {invoices.filter((i) => i.status === "overdue").length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nothing overdue right now.
            </p>
          ) : (
            <div className="divide-y">
              {invoices
                .filter((i) => i.status === "overdue")
                .map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {invoice.invoiceNo} · {invoice.billTo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-destructive">
                      {formatCurrency(invoice.amount - invoice.paidAmount)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
