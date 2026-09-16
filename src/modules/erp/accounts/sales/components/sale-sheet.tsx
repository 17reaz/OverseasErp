import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

import type {
  CreateSaleInput,
  Sale,
  SaleStatus,
  UpdateSaleInput,
} from "../sales-types";

interface SaleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /**
   * Create mode
   */
  onCreate?: (
    input: CreateSaleInput,
  ) => Promise<void> | void;

  /**
   * Edit mode
   */
  sale?: Sale | null;

  onUpdate?: (
    saleId: string,
    input: UpdateSaleInput,
  ) => Promise<void> | void;
}

const defaultForm: CreateSaleInput = {
  partyId: null,
  customerName: "",
  service: "",
  description: "",
  amount: 0,
  costAmount: 0,
  paidAmount: 0,
  saleDate: new Date().toISOString().slice(0, 10),
  status: "draft",
  notes: "",
};

export function SaleSheet({
  open,
  onOpenChange,
  onCreate,
  sale,
  onUpdate,
}: SaleSheetProps) {
  const isEditMode = Boolean(sale);

  const [form, setForm] =
    useState<CreateSaleInput>(defaultForm);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (sale) {
      setForm({
        partyId: sale.partyId,
        customerName: sale.customerName,
        service: sale.service,
        description: sale.description ?? "",
        amount: sale.amount,
        costAmount: sale.costAmount,
        paidAmount: sale.paidAmount,
        saleDate: sale.saleDate,
        status: sale.status,
        notes: sale.notes ?? "",
      });
    } else {
      setForm({
        ...defaultForm,
        saleDate: new Date()
          .toISOString()
          .slice(0, 10),
      });
    }

    setLoading(false);
  }, [open, sale]);

  const updateField = <
    K extends keyof CreateSaleInput,
  >(
    field: K,
    value: CreateSaleInput[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!form.customerName.trim()) {
      return;
    }

    if (!form.service.trim()) {
      return;
    }

    if (form.amount <= 0) {
      return;
    }

    if (form.costAmount < 0) {
      return;
    }

    if (
      form.paidAmount < 0 ||
      form.paidAmount > form.amount
    ) {
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && sale) {
        const updateInput: UpdateSaleInput = {
          partyId: form.partyId ?? null,
          customerName:
            form.customerName.trim(),
          service: form.service.trim(),
          description:
            form.description?.trim() || null,
          amount: form.amount,
          costAmount: form.costAmount,
          paidAmount: form.paidAmount,
          saleDate: form.saleDate,
          status: form.status,
          notes: form.notes?.trim() || null,
        };

        await onUpdate?.(
          sale.id,
          updateInput,
        );
      } else {
        await onCreate?.({
          partyId: form.partyId ?? null,
          customerName:
            form.customerName.trim(),
          service: form.service.trim(),
          description:
            form.description?.trim() || "",
          amount: form.amount,
          costAmount: form.costAmount,
          paidAmount: form.paidAmount,
          saleDate: form.saleDate,
          status: form.status,
          notes: form.notes.trim(),
        });
      }

      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const dueAmount = Math.max(
    form.amount - form.paidAmount,
    0,
  );

  const grossProfit =
    form.amount - form.costAmount;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg"
      >
        <form
          onSubmit={handleSubmit}
          className="flex h-full flex-col"
        >
          <SheetHeader>
            <SheetTitle>
              {isEditMode
                ? "Edit Sale"
                : "New Sale"}
            </SheetTitle>

            <SheetDescription>
              {isEditMode
                ? "Update the customer sale or service revenue."
                : "Record a customer sale or service revenue."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6">
            {/* Customer */}
            <div className="space-y-2">
              <Label htmlFor="sale-customer">
                Customer
              </Label>

              <Input
                id="sale-customer"
                value={form.customerName}
                onChange={(event) =>
                  updateField(
                    "customerName",
                    event.target.value,
                  )
                }
                placeholder="Customer name"
              />
            </div>

            {/* Service */}
            <div className="space-y-2">
              <Label htmlFor="sale-service">
                Service
              </Label>

              <Input
                id="sale-service"
                value={form.service}
                onChange={(event) =>
                  updateField(
                    "service",
                    event.target.value,
                  )
                }
                placeholder="e.g. Visa Processing"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="sale-description">
                Description
              </Label>

              <Textarea
                id="sale-description"
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                placeholder="Optional sale description"
                rows={3}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="sale-amount">
                Sale Amount
              </Label>

              <Input
                id="sale-amount"
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
                    Number(event.target.value) || 0,
                  )
                }
                placeholder="0.00"
              />
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <Label htmlFor="sale-cost">
                Cost Amount
              </Label>

              <Input
                id="sale-cost"
                type="number"
                min="0"
                step="0.01"
                value={
                  form.costAmount === 0
                    ? ""
                    : form.costAmount
                }
                onChange={(event) =>
                  updateField(
                    "costAmount",
                    Number(event.target.value) || 0,
                  )
                }
                placeholder="0.00"
              />

              <p className="text-xs text-muted-foreground">
                Direct cost associated with this sale.
              </p>
            </div>

            {/* Profit Preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Gross Profit
                </p>

                <p
                  className={`mt-1 font-semibold ${
                    grossProfit < 0
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {grossProfit.toLocaleString(
                    "en-BD",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}{" "}
                  BDT
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Due
                </p>

                <p className="mt-1 font-semibold">
                  {dueAmount.toLocaleString(
                    "en-BD",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}{" "}
                  BDT
                </p>
              </div>
            </div>

            {/* Paid Amount */}
            <div className="space-y-2">
              <Label htmlFor="sale-paid">
                Paid Amount
              </Label>

              <Input
                id="sale-paid"
                type="number"
                min="0"
                max={form.amount}
                step="0.01"
                value={
                  form.paidAmount === 0
                    ? ""
                    : form.paidAmount
                }
                onChange={(event) =>
                  updateField(
                    "paidAmount",
                    Number(event.target.value) || 0,
                  )
                }
                placeholder="0.00"
              />

              <p className="text-xs text-muted-foreground">
                Amount already received from the customer.
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="sale-date">
                Sale Date
              </Label>

              <Input
                id="sale-date"
                type="date"
                value={form.saleDate}
                onChange={(event) =>
                  updateField(
                    "saleDate",
                    event.target.value,
                  )
                }
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>
                Status
              </Label>

              <Select
                value={form.status}
                onValueChange={(value) =>
                  updateField(
                    "status",
                    value as SaleStatus,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="draft">
                    Draft
                  </SelectItem>

                  <SelectItem value="confirmed">
                    Confirmed
                  </SelectItem>

                  <SelectItem value="paid">
                    Paid
                  </SelectItem>

                  <SelectItem value="cancelled">
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="sale-notes">
                Notes
              </Label>

              <Textarea
                id="sale-notes"
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value,
                  )
                }
                placeholder="Optional notes"
                rows={4}
              />
            </div>
          </div>

          <SheetFooter className="border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                loading ||
                !form.customerName.trim() ||
                !form.service.trim() ||
                form.amount <= 0 ||
                form.costAmount < 0 ||
                form.paidAmount < 0 ||
                form.paidAmount > form.amount
              }
            >
              {loading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              {isEditMode
                ? "Save Changes"
                : "Create Sale"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
