// src/modules/erp/accounting/transactions/components/transaction-details-sheet.tsx

import {
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";

import type { Transaction } from "../transaction-types";

interface TransactionDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  transaction: Transaction | null;

  onEdit: (
    transaction: Transaction,
  ) => void;

  onDelete: (
    transaction: Transaction,
  ) => void;
}

function formatDateTime(
  value: string,
) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(`${value}T00:00:00`));
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
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b py-3 last:border-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="break-words text-sm font-medium">
        {value || "-"}
      </span>
    </div>
  );
}

export function TransactionDetailsSheet({
  open,
  onOpenChange,
  transaction,
  onEdit,
  onDelete,
}: TransactionDetailsSheetProps) {
  if (!transaction) {
    return null;
  }

  const currency =
    transaction.account?.currency ??
    "BDT";

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Transaction Details"
      description="View accounting transaction information."
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() =>
              onDelete(transaction)
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>

          <Button
            type="button"
            onClick={() =>
              onEdit(transaction)
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Amount summary */}

        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {transaction.type ===
                "income"
                  ? "Income"
                  : "Expense"}
              </p>

              <p
                className={`mt-1 text-2xl font-bold ${
                  transaction.type ===
                  "income"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                }`}
              >
                {transaction.type ===
                "income"
                  ? "+"
                  : "-"}
                {formatCurrency(
                  transaction.amount,
                  currency,
                )}
              </p>
            </div>

            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">
              {transaction.status}
            </span>
          </div>
        </div>

        {/* Main info */}

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Transaction
          </h3>

          <div>
            <DetailRow
              label="Date"
              value={formatDate(
                transaction.date,
              )}
            />

            <DetailRow
              label="Account"
              value={
                transaction.account
                  ?.name ?? "-"
              }
            />

            <DetailRow
              label="Category"
              value={
                transaction.category
                  ?.name ?? "-"
              }
            />

            <DetailRow
              label="Description"
              value={
                transaction.description ??
                "-"
              }
            />

            <DetailRow
              label="Reference"
              value={
                transaction.reference ??
                "-"
              }
            />
          </div>
        </div>

        {/* Related party */}

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Related Party
          </h3>

          <div>
            <DetailRow
              label="Type"
              value={
                transaction.party
                  ?.partyType ?? "-"
              }
            />

            <DetailRow
              label="Name"
              value={
                transaction.party?.name ??
                "-"
              }
            />

            <DetailRow
              label="Phone"
              value={
                transaction.party?.phone ??
                "-"
              }
            />
          </div>
        </div>

        {/* Audit */}

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Audit
          </h3>

          <div>
            <DetailRow
              label="Transaction ID"
              value={transaction.id}
            />

            <DetailRow
              label="Created"
              value={formatDateTime(
                transaction.createdAt,
              )}
            />

            <DetailRow
              label="Updated"
              value={formatDateTime(
                transaction.updatedAt,
              )}
            />

            <DetailRow
              label="Created By"
              value={
                transaction.createdBy ??
                "-"
              }
            />
          </div>
        </div>
      </div>
    </UniversalSheet>
  );
}