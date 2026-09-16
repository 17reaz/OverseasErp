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

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";

import {
  createInvoice,
  updateInvoice,
} from "../invoice-service";

import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceAgent,
  InvoiceStatus,
} from "../invoice-types";

interface InvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  invoice: Invoice | null;

  agents: InvoiceAgent[];

  onSuccess: (invoice: Invoice) => void;
}

const EMPTY_FORM: CreateInvoiceInput = {
  invoiceNo: "",
  customerName: "",
  agentId: null,

  issueDate: new Date()
    .toISOString()
    .slice(0, 10),

  dueDate: null,

  subtotal: 0,
  discount: 0,
  tax: 0,
  totalAmount: 0,
  paidAmount: 0,

  status: "draft",

  notes: "",
};

export function InvoiceSheet({
  open,
  onOpenChange,
  invoice,
  agents,
  onSuccess,
}: InvoiceSheetProps) {
  const [form, setForm] =
    useState<CreateInvoiceInput>(
      EMPTY_FORM,
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const isEditing = Boolean(invoice);

  /*
   * =========================================================
   * LOAD FORM
   * =========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (invoice) {
      setForm({
        invoiceNo:
          invoice.invoiceNo,

        customerName:
          invoice.customerName,

        agentId:
          invoice.agentId,

        issueDate:
          invoice.issueDate,

        dueDate:
          invoice.dueDate,

        subtotal:
          invoice.subtotal,

        discount:
          invoice.discount,

        tax:
          invoice.tax,

        totalAmount:
          invoice.totalAmount,

        paidAmount:
          invoice.paidAmount,

        status:
          invoice.status,

        notes:
          invoice.notes ?? "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,

        issueDate: new Date()
          .toISOString()
          .slice(0, 10),
      });
    }

    setError("");
  }, [open, invoice]);

  /*
   * =========================================================
   * CALCULATED TOTAL
   * =========================================================
   */

  const calculatedTotal = useMemo(() => {
    const subtotal = Number(
      form.subtotal ?? 0,
    );

    const discount = Number(
      form.discount ?? 0,
    );

    const tax = Number(
      form.tax ?? 0,
    );

    return Math.max(
      subtotal - discount + tax,
      0,
    );
  }, [
    form.subtotal,
    form.discount,
    form.tax,
  ]);

  /*
   * =========================================================
   * UPDATE FIELD
   * =========================================================
   */

  function updateField<
    K extends keyof CreateInvoiceInput,
  >(
    key: K,
    value: CreateInvoiceInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /*
   * =========================================================
   * NUMBER FIELD
   * =========================================================
   */

  function updateNumberField(
    key:
      | "subtotal"
      | "discount"
      | "tax"
      | "totalAmount"
      | "paidAmount",
    value: string,
  ) {
    updateField(
      key,
      value === ""
        ? 0
        : Number(value),
    );
  }

  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const customerName =
      form.customerName?.trim() ?? "";

    if (!customerName) {
      setError(
        "Customer name is required.",
      );
      return;
    }

    if (!form.issueDate) {
      setError(
        "Issue date is required.",
      );
      return;
    }

    const subtotal = Number(
      form.subtotal ?? 0,
    );

    const discount = Number(
      form.discount ?? 0,
    );

    const tax = Number(
      form.tax ?? 0,
    );

    const paidAmount = Number(
      form.paidAmount ?? 0,
    );

    if (subtotal < 0) {
      setError(
        "Subtotal cannot be negative.",
      );
      return;
    }

    if (discount < 0) {
      setError(
        "Discount cannot be negative.",
      );
      return;
    }

    if (tax < 0) {
      setError(
        "Tax cannot be negative.",
      );
      return;
    }

    if (paidAmount < 0) {
      setError(
        "Paid amount cannot be negative.",
      );
      return;
    }

    if (discount > subtotal) {
      setError(
        "Discount cannot be greater than subtotal.",
      );
      return;
    }

    const totalAmount = Math.max(
      subtotal - discount + tax,
      0,
    );

    if (paidAmount > totalAmount) {
      setError(
        "Paid amount cannot be greater than total amount.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload: CreateInvoiceInput = {
        invoiceNo:
          form.invoiceNo?.trim() || undefined,

        customerName,

        agentId:
          form.agentId || null,

        issueDate:
          form.issueDate,

        dueDate:
          form.dueDate || null,

        subtotal,

        discount,

        tax,

        totalAmount,

        paidAmount,

        status:
          form.status ?? "draft",

        notes:
          form.notes?.trim() || null,
      };

      const saved = invoice
        ? await updateInvoice(
            invoice.id,
            payload,
          )
        : await createInvoice(
            payload,
          );

      onSuccess(saved);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save invoice.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEditing
          ? "Edit Invoice"
          : "Create Invoice"
      }
      description={
        isEditing
          ? "Update invoice information."
          : "Create a new customer invoice."
      }
      onSubmit={handleSubmit}
      submitLabel={
        isEditing
          ? "Update Invoice"
          : "Create Invoice"
      }
      loading={saving}
      hasChanges={true}
    >
      <div className="space-y-6">
        {/* =================================================
         * ERROR
         * ================================================= */}

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* =================================================
         * INVOICE NUMBER
         * ================================================= */}

        <div className="space-y-2">
          <Label htmlFor="invoice-no">
            Invoice Number
          </Label>

          <Input
            id="invoice-no"
            value={
              form.invoiceNo ?? ""
            }
            onChange={(event) =>
              updateField(
                "invoiceNo",
                event.target.value,
              )
            }
            placeholder="INV-001"
          />

          <p className="text-xs text-muted-foreground">
            Leave empty to generate an invoice number automatically.
          </p>
        </div>

        {/* =================================================
         * CUSTOMER
         * ================================================= */}

        <div className="space-y-2">
          <Label htmlFor="invoice-customer">
            Customer Name
          </Label>

          <Input
            id="invoice-customer"
            value={
              form.customerName
            }
            onChange={(event) =>
              updateField(
                "customerName",
                event.target.value,
              )
            }
            placeholder="Customer name"
          />
        </div>

        {/* =================================================
         * AGENT
         * ================================================= */}

        <div className="space-y-2">
          <Label>
            Agent
          </Label>

          <Select
            value={
              form.agentId ?? "none"
            }
            onValueChange={(value) =>
              updateField(
                "agentId",
                value === "none"
                  ? null
                  : value,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="none">
                No agent
              </SelectItem>

              {agents.map((agent) => (
                <SelectItem
                  key={agent.id}
                  value={agent.id}
                >
                  {agent.name}
                  {agent.code
                    ? ` (${agent.code})`
                    : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* =================================================
         * DATES
         * ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoice-issue-date">
              Issue Date
            </Label>

            <Input
              id="invoice-issue-date"
              type="date"
              value={
                form.issueDate ?? ""
              }
              onChange={(event) =>
                updateField(
                  "issueDate",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-due-date">
              Due Date
            </Label>

            <Input
              id="invoice-due-date"
              type="date"
              value={
                form.dueDate ?? ""
              }
              onChange={(event) =>
                updateField(
                  "dueDate",
                  event.target.value ||
                    null,
                )
              }
            />
          </div>
        </div>

        {/* =================================================
         * AMOUNTS
         * ================================================= */}

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">
              Amount
            </h3>

            <p className="text-xs text-muted-foreground">
              Enter the invoice financial details.
            </p>
          </div>

          {/* Subtotal */}

          <div className="space-y-2">
            <Label htmlFor="invoice-subtotal">
              Subtotal
            </Label>

            <Input
              id="invoice-subtotal"
              type="number"
              min="0"
              step="0.01"
              value={
                form.subtotal === 0
                  ? ""
                  : form.subtotal
              }
              onChange={(event) =>
                updateNumberField(
                  "subtotal",
                  event.target.value,
                )
              }
              placeholder="0.00"
            />
          </div>

          {/* Discount */}

          <div className="space-y-2">
            <Label htmlFor="invoice-discount">
              Discount
            </Label>

            <Input
              id="invoice-discount"
              type="number"
              min="0"
              step="0.01"
              value={
                form.discount === 0
                  ? ""
                  : form.discount
              }
              onChange={(event) =>
                updateNumberField(
                  "discount",
                  event.target.value,
                )
              }
              placeholder="0.00"
            />
          </div>

          {/* Tax */}

          <div className="space-y-2">
            <Label htmlFor="invoice-tax">
              Tax
            </Label>

            <Input
              id="invoice-tax"
              type="number"
              min="0"
              step="0.01"
              value={
                form.tax === 0
                  ? ""
                  : form.tax
              }
              onChange={(event) =>
                updateNumberField(
                  "tax",
                  event.target.value,
                )
              }
              placeholder="0.00"
            />
          </div>

          {/* Total */}

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Amount
              </span>

              <span className="text-lg font-semibold">
                BDT{" "}
                {calculatedTotal.toLocaleString(
                  "en-BD",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}
              </span>
            </div>
          </div>

          {/* Paid */}

          <div className="space-y-2">
            <Label htmlFor="invoice-paid">
              Paid Amount
            </Label>

            <Input
              id="invoice-paid"
              type="number"
              min="0"
              step="0.01"
              value={
                form.paidAmount === 0
                  ? ""
                  : form.paidAmount
              }
              onChange={(event) =>
                updateNumberField(
                  "paidAmount",
                  event.target.value,
                )
              }
              placeholder="0.00"
            />

            <p className="text-xs text-muted-foreground">
              Leave 0 if nothing has been paid yet.
            </p>
          </div>
        </div>

        {/* =================================================
         * STATUS
         * ================================================= */}

        <div className="space-y-2">
          <Label>
            Status
          </Label>

          <Select
            value={
              form.status ?? "draft"
            }
            onValueChange={(value) =>
              updateField(
                "status",
                value as InvoiceStatus,
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="draft">
                Draft
              </SelectItem>

              <SelectItem value="sent">
                Sent
              </SelectItem>

              <SelectItem value="paid">
                Paid
              </SelectItem>

              <SelectItem value="overdue">
                Overdue
              </SelectItem>

              <SelectItem value="cancelled">
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* =================================================
         * NOTES
         * ================================================= */}

        <div className="space-y-2">
          <Label htmlFor="invoice-notes">
            Notes
          </Label>

          <Textarea
            id="invoice-notes"
            value={
              form.notes ?? ""
            }
            onChange={(event) =>
              updateField(
                "notes",
                event.target.value,
              )
            }
            placeholder="Additional invoice notes..."
            rows={4}
          />
        </div>

        {/* =================================================
         * SAVING
         * ================================================= */}

        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving invoice...
          </div>
        )}
      </div>
    </UniversalSheet>
  );
}