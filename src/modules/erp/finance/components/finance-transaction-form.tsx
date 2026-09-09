// src/modules/erp/finance/components/finance-transaction-form.tsx

import {
  FormDate,
  FormInput,
  FormSelect,
  FormTextarea,
} from "../../shared/ui/form-field";
import { FormSection } from "../../shared/forms/form-section";

import {
  TRANSACTION_CATEGORIES,
  TRANSACTION_STATUS_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from "../finance-constants";

import type {
  FinanceAccount,
  FinanceTransaction,
  TransactionType,
} from "../finance-types";

export interface TransactionFormValues {
  date: string;
  type: TransactionType;
  category: string;
  accountId: string;
  description: string;
  reference: string;
  amount: string;
  status: FinanceTransaction["status"];
}

interface FinanceTransactionFormProps {
  values: TransactionFormValues;
  onChange: (values: TransactionFormValues) => void;
  accounts: FinanceAccount[];
}

export function FinanceTransactionForm({
  values,
  onChange,
  accounts,
}: FinanceTransactionFormProps) {
  function set<K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  const categoryOptions = TRANSACTION_CATEGORIES[values.type].map((c) => ({
    value: c,
    label: c,
  }));

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  return (
    <div className="space-y-6">
      <FormSection title="Transaction details">
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Type"
            required
            value={values.type}
            options={TRANSACTION_TYPE_OPTIONS}
            onValueChange={(value) => {
              const type = value as TransactionType;
              onChange({
                ...values,
                type,
                category: TRANSACTION_CATEGORIES[type][0] ?? "",
              });
            }}
          />

          <FormDate
            label="Date"
            required
            value={values.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Category"
            required
            value={values.category}
            options={categoryOptions}
            onValueChange={(value) => set("category", value)}
          />

          <FormSelect
            label="Account"
            required
            value={values.accountId}
            options={accountOptions}
            placeholder="Select account"
            onValueChange={(value) => set("accountId", value)}
          />
        </div>

        <FormInput
          label="Amount"
          type="number"
          required
          min={0}
          value={values.amount}
          onChange={(e) => set("amount", e.target.value)}
          placeholder="0"
        />

        <FormTextarea
          label="Description"
          required
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What is this transaction for?"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Reference"
            description="Invoice / receipt no. (optional)"
            value={values.reference}
            onChange={(e) => set("reference", e.target.value)}
          />

          <FormSelect
            label="Status"
            required
            value={values.status}
            options={TRANSACTION_STATUS_OPTIONS}
            onValueChange={(value) =>
              set("status", value as FinanceTransaction["status"])
            }
          />
        </div>
      </FormSection>
    </div>
  );
}
