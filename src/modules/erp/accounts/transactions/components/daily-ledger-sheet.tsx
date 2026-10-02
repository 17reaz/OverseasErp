import {
  LockKeyhole,
  Printer,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  UniversalSheet,
} from "@/modules/erp/shared/forms/universal-sheet";

import type {
  Transaction,
} from "../transaction-types";

interface DailyLedgerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
}

function getToday() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(`${value}T00:00:00`),
  );
}

function formatCurrency(
  amount: number,
  currency = "BDT",
) {
  return new Intl.NumberFormat(
    "en-BD",
    {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function formatNumber(
  amount: number,
) {
  return new Intl.NumberFormat(
    "en-BD",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function LedgerRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-b py-2.5 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {transaction.account?.name ??
            "Unknown account"}
        </p>

        <div className="mt-0.5 flex min-w-0 gap-2 text-xs text-muted-foreground">
          <span className="truncate">
            {transaction.party?.name ??
              transaction.category?.name ??
              transaction.description ??
              "-"}
          </span>

          {transaction.reference && (
            <>
              <span>•</span>

              <span className="truncate">
                {transaction.reference}
              </span>
            </>
          )}
        </div>
      </div>

      <p className="whitespace-nowrap text-sm font-semibold tabular-nums">
        {formatNumber(
          transaction.amount,
        )}
      </p>
    </div>
  );
}

function LedgerColumn({
  title,
  transactions,
  total,
}: {
  title: string;
  transactions: Transaction[];
  total: number;
}) {
  return (
    <section className="ledger-column min-w-0">
      <div className="mb-3 border-b-2 border-foreground pb-2">
        <h2 className="text-base font-bold uppercase tracking-wide">
          {title}
        </h2>
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No {title.toLowerCase()} transactions
        </div>
      ) : (
        <div>
          {transactions.map(
            (transaction) => (
              <LedgerRow
                key={transaction.id}
                transaction={transaction}
              />
            ),
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t-2 border-foreground pt-2">
        <span className="text-sm font-bold uppercase">
          Total
        </span>

        <span className="text-sm font-bold tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>
    </section>
  );
}

export function DailyLedgerSheet({
  open,
  onOpenChange,
  transactions,
}: DailyLedgerSheetProps) {
  if (!open) {
    return null;
  }

  /*
   * Locked ledger:
   *
   * We intentionally use the transactions already loaded
   * by TransactionsPage.
   *
   * No create/edit/delete operation exists here.
   */

  const today = getToday();

  const todayTransactions =
    transactions.filter(
      (transaction) =>
        transaction.date === today,
    );

  const incomeTransactions =
    todayTransactions.filter(
      (transaction) =>
        transaction.type === "income",
    );

  const expenseTransactions =
    todayTransactions.filter(
      (transaction) =>
        transaction.type === "expense",
    );

  const totalIncome =
    incomeTransactions.reduce(
      (sum, transaction) =>
        sum + transaction.amount,
      0,
    );

  const totalExpense =
    expenseTransactions.reduce(
      (sum, transaction) =>
        sum + transaction.amount,
      0,
    );

  const netAmount =
    totalIncome - totalExpense;

  return (
    <>
      <UniversalSheet
        open={open}
        onOpenChange={onOpenChange}
        title="Daily Ledger"
        description="Locked journal view of today's transactions."
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LockKeyhole className="h-3.5 w-3.5" />

              <span>
                Locked journal
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  window.print()
                }
              >
                <Printer className="mr-2 h-4 w-4" />

                Print A4
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onOpenChange(false)
                }
              >
                <X className="mr-2 h-4 w-4" />

                Close
              </Button>
            </div>
          </div>
        }
      >
        <div className="daily-ledger-print-area">
          {/* Print Header */}

          <header className="ledger-header border-b pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">
                    DAILY LEDGER
                  </h1>

                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    <LockKeyhole className="h-3 w-3" />

                    Locked
                  </span>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Daily income and expense journal
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Date
                </p>

                <p className="text-sm font-semibold">
                  {formatDate(today)}
                </p>
              </div>
            </div>
          </header>

          {/* Ledger */}

          <div className="mt-5 grid grid-cols-2 divide-x">
            {/* Income */}

            <div className="pr-5">
              <LedgerColumn
                title="Income"
                transactions={
                  incomeTransactions
                }
                total={totalIncome}
              />
            </div>

            {/* Expense */}

            <div className="pl-5">
              <LedgerColumn
                title="Expense"
                transactions={
                  expenseTransactions
                }
                total={totalExpense}
              />
            </div>
          </div>

          {/* Summary */}

          <div className="mt-6 border-t-2 border-foreground pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Total Income
                </p>

                <p className="mt-1 text-lg font-bold tabular-nums">
                  {formatCurrency(
                    totalIncome,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Total Expense
                </p>

                <p className="mt-1 text-lg font-bold tabular-nums">
                  {formatCurrency(
                    totalExpense,
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase text-muted-foreground">
                  Net
                </p>

                <p className="mt-1 text-lg font-bold tabular-nums">
                  {formatCurrency(
                    netAmount,
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}

          <footer className="mt-8 border-t pt-3 text-[10px] text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>
                System generated daily ledger
              </span>

              <span>
                Transactions:
                {" "}
                {todayTransactions.length}
              </span>
            </div>
          </footer>
        </div>
      </UniversalSheet>

      {/* =================================================
       * A4 PRINT STYLES
       * ================================================= */}

      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }

            html,
            body {
              width: 210mm;
              min-height: 297mm;
              margin: 0;
              padding: 0;
              background: white !important;
            }

            body * {
              visibility: hidden !important;
            }

            .daily-ledger-print-area,
            .daily-ledger-print-area * {
              visibility: visible !important;
            }

            .daily-ledger-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;

              width: 190mm !important;
              min-height: 277mm !important;

              margin: 0 !important;
              padding: 0 !important;

              background: white !important;

              color: black !important;
            }

            .daily-ledger-print-area
              .ledger-header {
              padding-bottom: 5mm;
            }

            .daily-ledger-print-area
              .ledger-column {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .daily-ledger-print-area
              .ledger-column
              > div {
              break-inside: avoid;
            }

            .daily-ledger-print-area
              .text-muted-foreground {
              color: #555 !important;
            }

            .daily-ledger-print-area
              .border {
              border-color: #bbb !important;
            }

            .daily-ledger-print-area
              .border-b {
              border-color: #bbb !important;
            }

            .daily-ledger-print-area
              .border-t {
              border-color: #bbb !important;
            }

            .daily-ledger-print-area
              .border-foreground {
              border-color: #000 !important;
            }

            .daily-ledger-print-area
              .divide-x
              > :not([hidden]) ~ :not([hidden]) {
              border-left-color: #000 !important;
            }
          }
        `}
      </style>
    </>
  );
}