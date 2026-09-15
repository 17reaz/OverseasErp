// src/modules/erp/accounts/fixed-costs/components/fixed-cost-details-sheet.tsx

import {
  CheckCircle2,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";

import type { FixedCost } from "../fixed-costs-types";

import {
  dueStateClass,
  formatDate,
  formatDateTime,
  formatFrequency,
  formatMoney,
  getDueState,
  getDueStateLabel,
  statusClass,
} from "../fixed-costs-utils";

interface FixedCostDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  fixedCost: FixedCost | null;

  onEdit: (cost: FixedCost) => void;
  onDelete: (cost: FixedCost) => void;
  onMarkPaid: (cost: FixedCost) => void;
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
        {value || "—"}
      </span>
    </div>
  );
}

export function FixedCostDetailsSheet({
  open,
  onOpenChange,
  fixedCost,
  onEdit,
  onDelete,
  onMarkPaid,
}: FixedCostDetailsSheetProps) {
  if (!fixedCost) {
    return null;
  }

  const currency =
    fixedCost.account?.currency ?? "BDT";

  const dueState = getDueState(fixedCost);

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Fixed Cost Details"
      description="View this recurring business cost."
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() =>
              onDelete(fixedCost)
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>

          <div className="flex items-center gap-2">
            {fixedCost.status !==
              "paid" && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onMarkPaid(fixedCost)
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark Paid
              </Button>
            )}

            <Button
              type="button"
              onClick={() =>
                onEdit(fixedCost)
              }
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Amount summary */}

        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {formatFrequency(
                  fixedCost.frequency,
                )}{" "}
                • {fixedCost.category}
              </p>

              <p className="mt-1 text-2xl font-bold">
                {formatMoney(
                  fixedCost.amount,
                  currency,
                )}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(
                  fixedCost.status,
                )}`}
              >
                {fixedCost.status}
              </span>

              {(dueState === "overdue" ||
                dueState ===
                  "due_soon") && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${dueStateClass(
                    dueState,
                  )}`}
                >
                  {getDueStateLabel(
                    dueState,
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cost info */}

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Cost
          </h3>

          <div>
            <DetailRow
              label="Name"
              value={fixedCost.name}
            />

            <DetailRow
              label="Category"
              value={fixedCost.category}
            />

            <DetailRow
              label="Vendor"
              value={
                fixedCost.vendor ?? "—"
              }
            />

            <DetailRow
              label="Due Date"
              value={formatDate(
                fixedCost.dueDate,
              )}
            />
          </div>
        </div>

        {/* Payment */}

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Payment
          </h3>

          <div>
            <DetailRow
              label="Payment Date"
              value={formatDate(
                fixedCost.paymentDate,
              )}
            />

            <DetailRow
              label="Method"
              value={
                fixedCost.paymentMethod ??
                "—"
              }
            />

            <DetailRow
              label="Account"
              value={
                fixedCost.account?.name ??
                "—"
              }
            />
          </div>
        </div>

        {/* Notes */}

        {fixedCost.notes && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Notes
            </h3>

            <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
              {fixedCost.notes}
            </p>
          </div>
        )}

        {/* Audit */}

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Audit
          </h3>

          <div>
            <DetailRow
              label="Cost ID"
              value={fixedCost.id}
            />

            <DetailRow
              label="Created"
              value={formatDateTime(
                fixedCost.createdAt,
              )}
            />

            <DetailRow
              label="Updated"
              value={formatDateTime(
                fixedCost.updatedAt,
              )}
            />
          </div>
        </div>
      </div>
    </UniversalSheet>
  );
}
