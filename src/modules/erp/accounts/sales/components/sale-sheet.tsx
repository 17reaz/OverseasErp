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
  SaleStatus,
} from "../sales-types";

interface SaleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (input: CreateSaleInput) => Promise<void> | void;
}

const defaultForm: CreateSaleInput = {
  customerName: "",
  service: "",
  amount: 0,
  saleDate: new Date().toISOString().slice(0, 10),
  status: "draft",
  notes: "",
};

export function SaleSheet({
  open,
  onOpenChange,
  onCreate,
}: SaleSheetProps) {
  const [form, setForm] =
    useState<CreateSaleInput>(defaultForm);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      setLoading(false);
    }
  }, [open]);

  const updateField = <
    K extends keyof CreateSaleInput
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

    setLoading(true);

    try {
      await onCreate?.({
        ...form,
        customerName:
          form.customerName.trim(),
        service: form.service.trim(),
        notes: form.notes.trim(),
      });

      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

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
              New Sale
            </SheetTitle>

            <SheetDescription>
              Record a customer sale or service
              revenue.
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

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="sale-amount">
                Amount
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
                form.amount <= 0
              }
            >
              {loading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              Create Sale
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}