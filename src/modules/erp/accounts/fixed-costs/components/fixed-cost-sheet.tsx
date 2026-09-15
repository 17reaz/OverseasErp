// src/modules/erp/accounts/fixed-costs/components/fixed-cost-sheet.tsx

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";

import {
  createFixedCost,
  updateFixedCost,
} from "../fixed-costs-service";

import {
  FIXED_COST_CATEGORIES,
  FIXED_COST_FREQUENCY_OPTIONS,
  FIXED_COST_PAYMENT_METHODS,
  FIXED_COST_STATUS_OPTIONS,
  type CreateFixedCostInput,
  type FixedCost,
  type FixedCostAccount,
} from "../fixed-costs-types";

import { todayIso } from "../fixed-costs-utils";

interface FixedCostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  fixedCost: FixedCost | null;

  accounts: FixedCostAccount[];

  onSuccess: (cost: FixedCost) => void;
}

const EMPTY_FORM: CreateFixedCostInput = {
  name: "",
  category: "",

  amount: 0,
  frequency: "monthly",

  dueDate: todayIso(),

  status: "pending",

  paymentDate: null,
  paymentMethod: null,

  accountId: null,
  vendor: null,

  notes: null,
};

export function FixedCostSheet({
  open,
  onOpenChange,
  fixedCost,
  accounts,
  onSuccess,
}: FixedCostSheetProps) {
  const [form, setForm] =
    useState<CreateFixedCostInput>(
      EMPTY_FORM,
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");

  const isEditing = Boolean(fixedCost);

  useEffect(() => {
    if (!open) return;

    if (fixedCost) {
      setForm({
        name: fixedCost.name,
        category: fixedCost.category,

        amount: fixedCost.amount,
        frequency: fixedCost.frequency,

        dueDate: fixedCost.dueDate,

        status: fixedCost.status,

        paymentDate:
          fixedCost.paymentDate,
        paymentMethod:
          fixedCost.paymentMethod,

        accountId: fixedCost.accountId,
        vendor: fixedCost.vendor,

        notes: fixedCost.notes,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        dueDate: todayIso(),
      });
    }

    setError("");
  }, [open, fixedCost]);

  function updateField<
    K extends keyof CreateFixedCostInput,
  >(
    key: K,
    value: CreateFixedCostInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleStatusChange(
    value: CreateFixedCostInput["status"],
  ) {
    setForm((current) => ({
      ...current,
      status: value,

      // paid করলে payment date auto আজকের তারিখ
      paymentDate:
        value === "paid"
          ? (current.paymentDate ??
            todayIso())
          : null,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Cost name is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Please select a category.");
      return;
    }

    if (!form.amount || form.amount <= 0) {
      setError(
        "Amount must be greater than zero.",
      );
      return;
    }

    if (
      form.status === "paid" &&
      !form.paymentDate
    ) {
      setError(
        "Payment date is required for a paid cost.",
      );
      return;
    }

    try {
      setSaving(true);

      const saved = fixedCost
        ? await updateFixedCost(
            fixedCost.id,
            form,
          )
        : await createFixedCost(form);

      onSuccess(saved);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save fixed cost.",
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
          ? "Edit Fixed Cost"
          : "Add Fixed Cost"
      }
      description={
        isEditing
          ? "Update this recurring business cost."
          : "Record a recurring or one-time fixed business cost."
      }
      onSubmit={handleSubmit}
      submitLabel={
        isEditing
          ? "Update Fixed Cost"
          : "Save Fixed Cost"
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

        {/* Name */}

        <div className="space-y-2">
          <Label htmlFor="fixed-cost-name">
            Cost Name
          </Label>

          <Input
            id="fixed-cost-name"
            value={form.name}
            onChange={(event) =>
              updateField(
                "name",
                event.target.value,
              )
            }
            placeholder="e.g. Office Rent — Gulshan"
          />
        </div>

        {/* Category */}

        <div className="space-y-2">
          <Label htmlFor="fixed-cost-category">
            Category
          </Label>

          <Input
            id="fixed-cost-category"
            list="fixed-cost-category-options"
            value={form.category}
            onChange={(event) =>
              updateField(
                "category",
                event.target.value,
              )
            }
            placeholder="Select or type a category"
          />

          <datalist id="fixed-cost-category-options">
            {FIXED_COST_CATEGORIES.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                />
              ),
            )}
          </datalist>
        </div>

        {/* Amount + Frequency */}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fixed-cost-amount">
              Amount
            </Label>

            <Input
              id="fixed-cost-amount"
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

          <div className="space-y-2">
            <Label>Frequency</Label>

            <Select
              value={form.frequency}
              onValueChange={(value) =>
                updateField(
                  "frequency",
                  value as CreateFixedCostInput["frequency"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {FIXED_COST_FREQUENCY_OPTIONS.map(
                  (option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due date + Status */}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fixed-cost-due-date">
              Due Date
            </Label>

            <Input
              id="fixed-cost-due-date"
              type="date"
              value={form.dueDate ?? ""}
              onChange={(event) =>
                updateField(
                  "dueDate",
                  event.target.value ||
                    null,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>

            <Select
              value={form.status}
              onValueChange={(value) =>
                handleStatusChange(
                  value as CreateFixedCostInput["status"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {FIXED_COST_STATUS_OPTIONS.map(
                  (option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payment date — only when paid */}

        {form.status === "paid" && (
          <div className="space-y-2">
            <Label htmlFor="fixed-cost-payment-date">
              Payment Date
            </Label>

            <Input
              id="fixed-cost-payment-date"
              type="date"
              value={
                form.paymentDate ?? ""
              }
              onChange={(event) =>
                updateField(
                  "paymentDate",
                  event.target.value ||
                    null,
                )
              }
            />
          </div>
        )}

        {/* Payment method + Account */}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Payment Method</Label>

            <Select
              value={
                form.paymentMethod ??
                "none"
              }
              onValueChange={(value) =>
                updateField(
                  "paymentMethod",
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
                  Not specified
                </SelectItem>

                {FIXED_COST_PAYMENT_METHODS.map(
                  (method) => (
                    <SelectItem
                      key={method}
                      value={method}
                    >
                      {method}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Paid From Account</Label>

            <Select
              value={
                form.accountId ?? "none"
              }
              onValueChange={(value) =>
                updateField(
                  "accountId",
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
                  No account
                </SelectItem>

                {accounts.map(
                  (account) => (
                    <SelectItem
                      key={account.id}
                      value={account.id}
                    >
                      {account.name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vendor */}

        <div className="space-y-2">
          <Label htmlFor="fixed-cost-vendor">
            Vendor
          </Label>

          <Input
            id="fixed-cost-vendor"
            value={form.vendor ?? ""}
            onChange={(event) =>
              updateField(
                "vendor",
                event.target.value,
              )
            }
            placeholder="Who is this paid to?"
          />
        </div>

        {/* Notes */}

        <div className="space-y-2">
          <Label htmlFor="fixed-cost-notes">
            Notes
          </Label>

          <Textarea
            id="fixed-cost-notes"
            value={form.notes ?? ""}
            onChange={(event) =>
              updateField(
                "notes",
                event.target.value,
              )
            }
            placeholder="Agreement number, contact person, renewal terms..."
            rows={3}
          />
        </div>

        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving fixed cost...
          </div>
        )}
      </div>
    </UniversalSheet>
  );
}
