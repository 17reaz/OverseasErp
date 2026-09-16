import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Loader2,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import type { FinanceParty } from "./party-types";

export interface DummyPartyStatementEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface PartyStatementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party: FinanceParty | null;
}

const dummyStatements: Record<
  string,
  DummyPartyStatementEntry[]
> = {
  default: [
    {
      id: "1",
      date: "2026-09-08",
      description: "Visa Processing",
      debit: 20000,
      credit: 0,
      balance: 130000,
    },
    {
      id: "2",
      date: "2026-09-05",
      description: "Medical Expense",
      debit: 10000,
      credit: 0,
      balance: 150000,
    },
    {
      id: "3",
      date: "2026-09-03",
      description: "Payment Received",
      debit: 0,
      credit: 80000,
      balance: 160000,
    },
    {
      id: "4",
      date: "2026-09-01",
      description: "Opening Balance",
      debit: 0,
      credit: 80000,
      balance: 80000,
    },
  ],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getPartyTypeLabel(
  type: FinanceParty["partyType"],
): string {
  switch (type) {
    case "agent":
      return "Agent";

    case "vendor":
      return "Vendor";

    case "candidate":
      return "Customer";

    default:
      return type;
  }
}

export function PartyStatementSheet({
  open,
  onOpenChange,
  party,
}: PartyStatementSheetProps) {
  if (!party) {
    return null;
  }

  const entries =
    dummyStatements[party.id] ??
    dummyStatements.default;

  const currentBalance =
    entries.length > 0
      ? entries[0].balance
      : 0;

  const totalDebit = entries.reduce(
    (total, entry) => total + entry.debit,
    0,
  );

  const totalCredit = entries.reduce(
    (total, entry) => total + entry.credit,
    0,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-xl"
      >
        <SheetHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <div className="min-w-0">
              <SheetTitle className="truncate">
                {party.name}
              </SheetTitle>

              <SheetDescription className="mt-1">
                {getPartyTypeLabel(party.partyType)} statement
              </SheetDescription>
            </div>

            <Badge
              variant={
                party.isActive
                  ? "default"
                  : "secondary"
              }
            >
              {party.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          {/* Current Balance */}
          <div className="mt-6 rounded-xl border bg-muted/30 p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="size-4" />
              Current Balance
            </div>

            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatCurrency(currentBalance)}
            </p>
          </div>

          {/* Summary */}
          <div className="mt-4 grid grid-cols-3 divide-x rounded-xl border">
            <div className="p-4">
              <p className="text-xs text-muted-foreground">
                Received
              </p>

              <p className="mt-1 font-semibold">
                {formatCurrency(totalCredit)}
              </p>
            </div>

            <div className="p-4">
              <p className="text-xs text-muted-foreground">
                Paid
              </p>

              <p className="mt-1 font-semibold">
                {formatCurrency(totalDebit)}
              </p>
            </div>

            <div className="p-4">
              <p className="text-xs text-muted-foreground">
                Net
              </p>

              <p className="mt-1 font-semibold">
                {formatCurrency(
                  totalCredit - totalDebit,
                )}
              </p>
            </div>
          </div>

          {/* Statement */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Statement
                </h3>

                <p className="text-sm text-muted-foreground">
                  Transaction history
                </p>
              </div>

              <Badge variant="outline">
                {entries.length} entries
              </Badge>
            </div>

            <Separator className="my-4" />

            <div className="space-y-5">
              {entries.map((entry) => {
                const isCredit = entry.credit > 0;

                return (
                  <div
                    key={entry.id}
                    className="relative pl-8"
                  >
                    {/* Timeline */}
                    <div
                      className={`absolute left-0 top-1 flex size-6 items-center justify-center rounded-full ${
                        isCredit
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-orange-500/10 text-orange-600"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="size-3.5" />
                      ) : (
                        <ArrowUpRight className="size-3.5" />
                      )}
                    </div>

                    <div className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {entry.description}
                          </p>

                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="size-3.5" />

                            {formatDate(entry.date)}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {entry.credit > 0 && (
                            <p className="font-semibold text-emerald-600">
                              +{formatCurrency(entry.credit)}
                            </p>
                          )}

                          {entry.debit > 0 && (
                            <p className="font-semibold text-orange-600">
                              -{formatCurrency(entry.debit)}
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Balance
                        </span>

                        <span className="font-medium">
                          {formatCurrency(entry.balance)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}