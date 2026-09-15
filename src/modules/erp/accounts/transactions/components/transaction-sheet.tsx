// src/modules/erp/accounting/transactions/components/transaction-sheet.tsx

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";

import {
  createTransaction,
  updateTransaction,
} from "../transaction-service";

import type {
  CreateTransactionInput,
  Transaction,
  TransactionAccount,
  TransactionCategory,
  TransactionParty,
} from "../transaction-types";

interface TransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  transaction: Transaction | null;

  accounts: TransactionAccount[];
  categories: TransactionCategory[];
  parties: TransactionParty[];

  onSuccess: (
    transaction: Transaction,
  ) => void;
}

const EMPTY_FORM: CreateTransactionInput =
  {
    type: "income",
    amount: 0,
    date: new Date()
      .toISOString()
      .slice(0, 10),

    accountId: "",
    categoryId: null,

    description: "",
    reference: "",

    status: "completed",

    partyId: null,
  };

export function TransactionSheet({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  parties,
  onSuccess,
}: TransactionSheetProps) {
  const [form, setForm] =
    useState<CreateTransactionInput>(
      EMPTY_FORM,
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const isEditing =
    Boolean(transaction);

  useEffect(() => {
    if (!open) return;

    if (transaction) {
      setForm({
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,

        accountId:
          transaction.accountId,

        categoryId:
          transaction.categoryId,

        description:
          transaction.description ?? "",

        reference:
          transaction.reference ?? "",

        status:
          transaction.status,

        partyId:
          transaction.partyId,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        accountId:
          accounts[0]?.id ?? "",
      });
    }

    setError("");
  }, [
    open,
    transaction,
    accounts,
  ]);

  const filteredCategories =
    useMemo(
      () =>
        categories.filter(
          (category) =>
            category.type ===
              form.type &&
            category.isActive,
        ),
      [
        categories,
        form.type,
      ],
    );

  const selectedParty =
    parties.find(
      (party) =>
        party.id ===
        form.partyId,
    ) ?? null;

  function updateField<
    K extends keyof CreateTransactionInput,
  >(
    key: K,
    value: CreateTransactionInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleTypeChange(
    value: "income" | "expense",
  ) {
    setForm((current) => ({
      ...current,
      type: value,
      categoryId: null,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!form.accountId) {
      setError(
        "Please select an account.",
      );
      return;
    }

    if (!form.amount || form.amount <= 0) {
      setError(
        "Amount must be greater than zero.",
      );
      return;
    }

    if (!form.date) {
      setError(
        "Transaction date is required.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload: CreateTransactionInput =
        {
          ...form,

          description:
            form.description?.trim() ||
            null,

          reference:
            form.reference?.trim() ||
            null,
        };

      const saved =
        transaction
          ? await updateTransaction(
              transaction.id,
              payload,
            )
          : await createTransaction(
              payload,
            );

      onSuccess(saved);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save transaction.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEditing
          ? "Edit Transaction"
          : "Add Transaction"
      }
      description={
        isEditing
          ? "Update this accounting transaction."
          : "Create a new accounting transaction."
      }
      onSubmit={handleSubmit}
      submitLabel={
        isEditing
          ? "Update Transaction"
          : "Save Transaction"
      }
      loading={saving}
      hasChanges={true}
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Type */}

        <div className="space-y-2">
          <Label>Transaction Type</Label>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={
                form.type === "income"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                handleTypeChange(
                  "income",
                )
              }
            >
              Income
            </Button>

            <Button
              type="button"
              variant={
                form.type === "expense"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                handleTypeChange(
                  "expense",
                )
              }
            >
              Expense
            </Button>
          </div>
        </div>

        {/* Amount */}

        <div className="space-y-2">
          <Label htmlFor="transaction-amount">
            Amount
          </Label>

          <Input
            id="transaction-amount"
            type="number"
            min="0"
            step="0.01"
            value={
              form.amount === 0
                ? ""
                : form.amount
            }
            onChange={(event) =>
              updateField(
                "amount",
                Number(
                  event.target.value,
                ),
              )
            }
            placeholder="0.00"
          />
        </div>

        {/* Date */}

        <div className="space-y-2">
          <Label htmlFor="transaction-date">
            Date
          </Label>

          <Input
            id="transaction-date"
            type="date"
            value={form.date}
            onChange={(event) =>
              updateField(
                "date",
                event.target.value,
              )
            }
          />
        </div>

        {/* Account */}

        <div className="space-y-2">
          <Label>Account</Label>

          <Select
            value={form.accountId}
            onValueChange={(value) =>
              updateField(
                "accountId",
                value,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>

            <SelectContent>
              {accounts.map(
                (account) => (
                  <SelectItem
                    key={account.id}
                    value={account.id}
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {account.name}
                      </span>

                      <span className="text-xs text-muted-foreground capitalize">
                        {account.type.replace(
                          "_",
                          " ",
                        )}
                      </span>
                    </div>
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}

        <div className="space-y-2">
          <Label>Category</Label>

          <Select
            value={
              form.categoryId ??
              "none"
            }
            onValueChange={(value) =>
              updateField(
                "categoryId",
                value === "none"
                  ? null
                  : value,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="none">
                No category
              </SelectItem>

              {filteredCategories.map(
                (category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Related party */}

        <div className="space-y-2">
          <Label>
            Related To
          </Label>

          <Select
            value={
              form.partyId ??
              "none"
            }
            onValueChange={(value) =>
              updateField(
                "partyId",
                value === "none"
                  ? null
                  : value,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="none">
                None
              </SelectItem>

              {parties.map(
                (party) => (
                  <SelectItem
                    key={party.id}
                    value={party.id}
                  >
                    {party.name} —{" "}
                    {party.partyType}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          {selectedParty && (
            <p className="text-xs text-muted-foreground">
              Linked to{" "}
              {selectedParty.partyType}:
              {" "}
              {selectedParty.name}
            </p>
          )}
        </div>

        {/* Status */}

        <div className="space-y-2">
          <Label>Status</Label>

          <Select
            value={form.status}
            onValueChange={(value) =>
              updateField(
                "status",
                value as CreateTransactionInput["status"],
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="pending">
                Pending
              </SelectItem>

              <SelectItem value="completed">
                Completed
              </SelectItem>

              <SelectItem value="cancelled">
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}

        <div className="space-y-2">
          <Label htmlFor="transaction-description">
            Description
          </Label>

          <Textarea
            id="transaction-description"
            value={
              form.description ??
              ""
            }
            onChange={(event) =>
              updateField(
                "description",
                event.target.value,
              )
            }
            placeholder="What is this transaction for?"
            rows={3}
          />
        </div>

        {/* Reference */}

        <div className="space-y-2">
          <Label htmlFor="transaction-reference">
            Reference
          </Label>

          <Input
            id="transaction-reference"
            value={
              form.reference ?? ""
            }
            onChange={(event) =>
              updateField(
                "reference",
                event.target.value,
              )
            }
            placeholder="Invoice / receipt / reference number"
          />
        </div>

        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving transaction...
          </div>
        )}
      </div>
    </UniversalSheet>
  );
}