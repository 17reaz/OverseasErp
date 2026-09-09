// src/modules/erp/finance/components/finance-invoice-form.tsx

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { UniversalSheet } from "../../shared/forms/universal-sheet";
import { FormSection } from "../../shared/forms/form-section";
import {
  FormDate,
  FormInput,
  FormSelect,
  FormTextarea,
} from "../../shared/ui/form-field";

import { createInvoice, updateInvoice } from "../finance-service";
import { INVOICE_STATUS_OPTIONS } from "../finance-constants";

import type { FinanceInvoice } from "../finance-types";

interface FinanceInvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: FinanceInvoice | null;
  onSuccess: (invoice: FinanceInvoice) => void;
}

interface InvoiceFormValues {
  billTo: string;
  agent: string;
  issueDate: string;
  dueDate: string;
  amount: string;
  paidAmount: string;
  status: FinanceInvoice["status"];
  notes: string;
}

function emptyValues(): InvoiceFormValues {
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date();
  due.setDate(due.getDate() + 14);

  return {
    billTo: "",
    agent: "",
    issueDate: today,
    dueDate: due.toISOString().slice(0, 10),
    amount: "",
    paidAmount: "0",
    status: "draft",
    notes: "",
  };
}

function toValues(invoice: FinanceInvoice): InvoiceFormValues {
  return {
    billTo: invoice.billTo,
    agent: invoice.agent ?? "",
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    amount: String(invoice.amount),
    paidAmount: String(invoice.paidAmount),
    status: invoice.status,
    notes: invoice.notes ?? "",
  };
}

export function FinanceInvoiceForm({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: FinanceInvoiceFormProps) {
  const [values, setValues] = useState<InvoiceFormValues>(emptyValues());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(invoice ? toValues(invoice) : emptyValues());
  }, [open, invoice]);

  function set<K extends keyof InvoiceFormValues>(
    key: K,
    value: InvoiceFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.billTo || !values.amount) return;

    setLoading(true);

    try {
      const payload = {
        billTo: values.billTo,
        agent: values.agent || null,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        amount: Number(values.amount),
        paidAmount: Number(values.paidAmount || 0),
        status: values.status,
        notes: values.notes || null,
      };

      const saved = invoice
        ? await updateInvoice(invoice.id, payload)
        : await createInvoice(payload);

      onSuccess(saved);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save invoice:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={invoice ? `Edit ${invoice.invoiceNo}` : "New Invoice"}
      description="Dummy data — nothing is persisted to a database yet."
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel={invoice ? "Save Changes" : "Create Invoice"}
    >
      <div className="space-y-6">
        <FormSection title="Bill to">
          <FormInput
            label="Candidate / Client name"
            required
            value={values.billTo}
            onChange={(e) => set("billTo", e.target.value)}
          />

          <FormInput
            label="Agent"
            description="Optional"
            value={values.agent}
            onChange={(e) => set("agent", e.target.value)}
          />
        </FormSection>

        <FormSection title="Invoice details">
          <div className="grid grid-cols-2 gap-4">
            <FormDate
              label="Issue Date"
              required
              value={values.issueDate}
              onChange={(e) => set("issueDate", e.target.value)}
            />

            <FormDate
              label="Due Date"
              required
              value={values.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Amount"
              type="number"
              required
              min={0}
              value={values.amount}
              onChange={(e) => set("amount", e.target.value)}
            />

            <FormInput
              label="Paid Amount"
              type="number"
              min={0}
              value={values.paidAmount}
              onChange={(e) => set("paidAmount", e.target.value)}
            />
          </div>

          <FormSelect
            label="Status"
            required
            value={values.status}
            options={INVOICE_STATUS_OPTIONS}
            onValueChange={(value) =>
              set("status", value as FinanceInvoice["status"])
            }
          />

          <FormTextarea
            label="Notes"
            description="Optional"
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </FormSection>
      </div>
    </UniversalSheet>
  );
}
