import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  ReceiptText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getAgencyProfile,
  type AgencyProfileData,
} from "./agency-profile-service";

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

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

function getInitials(
  name: string | null,
): string {
  if (!name?.trim()) {
    return "?";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

export function AgencyProfilePage() {
  const { agencyId } =
    useParams<{
      agencyId: string;
    }>();

  const [data, setData] =
    useState<AgencyProfileData | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadProfile = useCallback(
    async () => {
      if (!agencyId) {
        setError(
          "Agency ID is missing.",
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError(null);

        /*
         * IMPORTANT:
         * Agency IDs are UUID strings.
         * Do NOT convert agencyId to Number().
         */
        const result =
          await getAgencyProfile(
            agencyId,
          );

        setData(result);
      } catch (err) {
        console.error(
          "Failed to load agency profile:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load agency profile.",
        );
      } finally {
        setLoading(false);
      }
    },
    [agencyId],
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const formattedBalance =
    useMemo(() => {
      if (!data) {
        return "৳0";
      }

      return formatCurrency(
        data.summary.balance,
      );
    }, [data]);

  /* =====================================================
   * LOADING
   * ===================================================== */

  if (loading) {
    return (
      <div className="space-y-6 pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />

          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>

        <Skeleton className="h-32 rounded-xl" />

        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  /* =====================================================
   * ERROR
   * ===================================================== */

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          asChild
        >
          <Link to="/app/agencies">
            <ArrowLeft />
            Back to Agencies
          </Link>
        </Button>

        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
          <AlertCircle className="size-8 text-destructive" />

          <div className="space-y-1">
            <p className="font-medium text-destructive">
              {error ??
                "Agency not found."}
            </p>

            <p className="text-sm text-muted-foreground">
              Try going back and selecting
              the agency again.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void loadProfile()
            }
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const {
    agency,
    summary,
    transactions,
  } = data;

  return (
    <div className="min-h-0 space-y-6 pb-6">

      {/* =================================================
       * HEADER
       * ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0"
          >
            <Link to="/app/agencies">
              <ArrowLeft />
            </Link>
          </Button>

          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            aria-hidden="true"
          >
            {getInitials(
              agency.name,
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">

              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {agency.name ??
                  "Unnamed Agency"}
              </h1>

              <Badge
                variant={
                  agency.is_active
                    ? "default"
                    : "secondary"
                }
              >
                {agency.is_active
                  ? "Active"
                  : "Inactive"}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {agency.code
                ? `Code: ${agency.code}`
                : "Agency profile"}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
       * AGENCY INFO
       * ================================================= */}

      <Card>
        <CardHeader>
          <CardTitle>
            Agency Information
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-xs text-muted-foreground">
                Name
              </p>

              <p className="mt-1 font-medium">
                {agency.name ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Agency Code
              </p>

              <p className="mt-1 font-medium">
                {agency.code ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Phone
              </p>

              <p className="mt-1 font-medium">
                {agency.phone ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Email
              </p>

              <p className="mt-1 font-medium">
                {agency.email ?? "—"}
              </p>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted-foreground">
                Address
              </p>

              <p className="mt-1 font-medium">
                {agency.address ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Created
              </p>

              <p className="mt-1 font-medium">
                {formatDate(
                  agency.created_at,
                )}
              </p>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* =================================================
       * FINANCIAL SUMMARY
       * ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Total Income
              </p>

              <ArrowDownLeft className="size-4 text-muted-foreground" />
            </div>

            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(
                summary.totalIncome,
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Total Expense
              </p>

              <ArrowUpRight className="size-4 text-muted-foreground" />
            </div>

            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(
                summary.totalExpense,
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Balance
              </p>

              <CreditCard className="size-4 text-muted-foreground" />
            </div>

            <p className="mt-2 text-2xl font-semibold">
              {formattedBalance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Transactions
              </p>

              <ReceiptText className="size-4 text-muted-foreground" />
            </div>

            <p className="mt-2 text-2xl font-semibold">
              {summary.transactionCount}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* =================================================
       * LEDGER
       * ================================================= */}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <CardTitle>
                Financial Statement
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Complete transaction history
              </p>
            </div>

            <Badge variant="outline">
              {transactions.length}{" "}
              {transactions.length === 1
                ? "entry"
                : "entries"}
            </Badge>

          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-0">

          {transactions.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">

              <ReceiptText className="size-8 text-muted-foreground" />

              <p className="mt-3 font-medium">
                No transactions yet
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Financial transactions for
                this agency will appear here.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-sm">

                <thead>
                  <tr className="border-b bg-muted/30 text-left">

                    <th className="px-4 py-3 font-medium">
                      Date
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Description
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Account
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Category
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Debit
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Credit
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Balance
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {transactions.map(
                    (transaction) => {
                      const isIncome =
                        transaction.type ===
                        "income";

                      return (
                        <tr
                          key={
                            transaction.id
                          }
                          className="border-b last:border-0"
                        >

                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="size-3.5 text-muted-foreground" />

                              {formatDate(
                                transaction.transactionDate,
                              )}
                            </div>
                          </td>

                          <td className="max-w-[280px] px-4 py-4">

                            <div className="font-medium">
                              {transaction.description ??
                                "No description"}
                            </div>

                            {transaction.reference && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                Ref:{" "}
                                {
                                  transaction.reference
                                }
                              </div>
                            )}

                          </td>

                          <td className="px-4 py-4">
                            {transaction.accountName ??
                              "—"}
                          </td>

                          <td className="px-4 py-4">
                            {transaction.categoryName ??
                              "—"}
                          </td>

                          <td className="px-4 py-4 text-right">
                            {!isIncome ? (
                              <span className="font-medium">
                                {formatCurrency(
                                  transaction.amount,
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            {isIncome ? (
                              <span className="font-medium">
                                {formatCurrency(
                                  transaction.amount,
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">

                            <div className="font-semibold">
                              {formatCurrency(
                                transaction.balance,
                              )}
                            </div>

                            <Badge
                              variant="outline"
                              className="mt-1 text-[10px]"
                            >
                              {formatStatus(
                                transaction.status,
                              )}
                            </Badge>

                          </td>

                        </tr>
                      );
                    },
                  )}
                </tbody>

              </table>

            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}