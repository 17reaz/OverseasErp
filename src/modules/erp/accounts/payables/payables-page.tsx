import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowUpRight,
  CircleDollarSign,
  Loader2,
  Search,
  Users,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getPayables,
  type Payable,
} from "./payables-service";

function formatAmount(amount: number) {
  return amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Date(
    `${date}T00:00:00`,
  ).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(
  status: Payable["status"],
) {
  switch (status) {
    case "open":
      return "Open";

    case "partial":
      return "Partial";

    case "paid":
      return "Paid";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

export function PayablesPage() {
  const [payables, setPayables] =
    useState<Payable[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const loadPayables = useCallback(
    async () => {
      setLoading(true);

      try {
        const data =
          await getPayables();

        setPayables(data);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadPayables();
  }, [loadPayables]);

  const filteredPayables =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return payables;
      }

      return payables.filter(
        (item) =>
          item.vendorName
            .toLowerCase()
            .includes(query) ||
          item.description
            .toLowerCase()
            .includes(query),
      );
    }, [payables, search]);

  const totalPayable =
    payables.reduce(
      (sum, item) =>
        sum + item.dueAmount,
      0,
    );

  const totalAmount =
    payables.reduce(
      (sum, item) =>
        sum + item.amount,
      0,
    );

  const totalPaid =
    payables.reduce(
      (sum, item) =>
        sum + item.paidAmount,
      0,
    );

  const vendorCount =
    new Set(
      payables
        .map((item) => item.partyId)
        .filter(Boolean),
    ).size;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Payables
          </h1>

          <p className="text-sm text-muted-foreground">
            Track vendor balances and
            outstanding payments.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            void loadPayables();
          }}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : null}

          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payable
            </CardTitle>

            <CircleDollarSign className="size-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              ৳ {formatAmount(totalPayable)}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Currently outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Amount
            </CardTitle>

            <ArrowUpRight className="size-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              ৳ {formatAmount(totalAmount)}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Total vendor obligations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Paid
            </CardTitle>

            <CircleDollarSign className="size-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              ৳ {formatAmount(totalPaid)}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Already paid to vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Vendors
            </CardTitle>

            <Users className="size-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {vendorCount}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Vendors with outstanding balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search vendor or description..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Vendor
                </TableHead>

                <TableHead>
                  Description
                </TableHead>

                <TableHead>
                  Due Date
                </TableHead>

                <TableHead className="text-right">
                  Amount
                </TableHead>

                <TableHead className="text-right">
                  Paid
                </TableHead>

                <TableHead className="text-right">
                  Due
                </TableHead>

                <TableHead>
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center"
                  >
                    <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredPayables.length ===
                0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No outstanding payables found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayables.map(
                  (item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.vendorName}
                      </TableCell>

                      <TableCell>
                        {item.description || "—"}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          item.dueDate,
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        ৳{" "}
                        {formatAmount(
                          item.amount,
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        ৳{" "}
                        {formatAmount(
                          item.paidAmount,
                        )}
                      </TableCell>

                      <TableCell className="text-right font-semibold">
                        ৳{" "}
                        {formatAmount(
                          item.dueAmount,
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                          {getStatusLabel(
                            item.status,
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ),
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
