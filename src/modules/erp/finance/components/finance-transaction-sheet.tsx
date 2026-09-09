// src/modules/erp/finance/components/finance-transaction-sheet.tsx

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { UniversalSheet } from "../../shared/forms/universal-sheet";

import {
  FinanceTransactionForm,
  type TransactionFormValues,
} from "./finance-transaction-form";

import { createTransaction, updateTransaction } from "../finance-service";

import type { FinanceAccount, FinanceTransaction } from "../finance-types";

interface FinanceTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: FinanceTransaction | null;
  accounts: FinanceAccount[];
  onSuccess: (transaction: FinanceTransaction) => void;
}

function emptyValues(accounts: FinanceAccount[]): TransactionFormValues {
  return {
    date: new Date().toISOString().slice(0, 10),
    type: "income",
    category: "",
    accountId: accounts[0]?.id ?? "",
    description: "",
    reference: "",
    amount: "",
    status: "completed",
  };
}

function toValues(transaction: FinanceTransaction): TransactionFormValues {
  return {
    date: transaction.date,
    type: transaction.type,
    category: transaction.category,
    accountId: transaction.accountId,
    description: transaction.description,
    reference: transaction.reference ?? "",
    amount: String(transaction.amount),
    status: transaction.status,
  };
}

export function FinanceTransactionSheet({
  open,
  onOpenChange,
  transaction,
  accounts,
  onSuccess,
}: FinanceTransactionSheetProps) {
  const [values, setValues] = useState<TransactionFormValues>(
    emptyValues(accounts),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setValues(transaction ? toValues(transaction) : emptyValues(accounts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.category || !values.accountId || !values.amount) return;

    setLoading(true);

    try {
      const payload = {
        date: values.date,
        type: values.type,
        category: values.category,
        accountId: values.accountId,
        description: values.description,
        reference: values.reference || null,
        amount: Number(values.amount),
        status: values.status,
      };

      const saved = transaction
        ? await updateTransaction(transaction.id, payload)
        : await createTransaction(payload);

      onSuccess(saved);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save transaction:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={transaction ? "Edit Transaction" : "Add Transaction"}
      description="Dummy data — nothing is persisted to a database yet."
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel={transaction ? "Save Changes" : "Add Transaction"}
    >
      <FinanceTransactionForm
        values={values}
        onChange={setValues}
        accounts={accounts}
      />
    </UniversalSheet>
  );
}
