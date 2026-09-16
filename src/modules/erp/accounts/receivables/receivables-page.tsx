import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDownLeft,
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
  getReceivables,
  type Receivable,
} from "./receivables-service";

function formatAmount(amount: number) {
  return amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date: string) {
  return new Date(
    `${date}T00:00:00`,
  ).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReceivablesPage() {
  const [receivables, setReceivables] =
    useState<Receivable[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const loadReceivables = useCallback(
    async () => {
      setLoading(true);

      try {
        const data =
          await getReceivables();

        setReceivables(data);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadReceivables();
  }, [loadReceivables]);

  const filteredReceivables =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return receivables;
      }

      return receivables.filter(
        (item) =>
          item.customerName
            .toLowerCase()
            .includes(query) ||
          item.service
            .toLowerCase()
            .includes(query),
      );
    }, [receivables, search]);

  const totalReceivable =
    receivables.reduce(
      (sum, item) =>
        sum + item.dueAmount,
      0,
    );

  const totalSales =
    receivables.reduce(
      (sum, item) =>
        sum + item.amount,
      0,
    );

  const totalCollected =
    receivables.reduce(
      (sum, item) =>
        sum + item.paidAmount,
      0,
    );

  const customerCount =
    new Set(
      receivables
        .map((item) => item.partyId)
        .filter(Boolean),
    ).size;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Receivables
          </h1>

          <p className="text-sm text-muted-foreground">
            Track customer balances and
            outstanding payments.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            void loadReceivables();
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
              Total Receivable
            </CardTitle>

            <CircleDollarSign className="size-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              ৳ {formatAmount(totalReceivable)}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Currently outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sales
            </CardTitle>

            <ArrowDownLeft className="size-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              ৳ {formatAmount(totalSales)}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Sales with outstanding balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Collected
            </CardTitle>

            <CircleDollarSign className="size-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              ৳ {formatAmount(totalCollected)}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Already received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Customers
            </CardTitle>

            <Users className="size-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {customerCount}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Customers with balance
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
            placeholder="Search customer or service..."
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
                  Customer
                </TableHead>

                <TableHead>
                  Service
                </TableHead>

                <TableHead>
                  Sale Date
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
              ) : filteredReceivables.length ===
                0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No outstanding receivables found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceivables.map(
                  (item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.customerName}
                      </TableCell>

                      <TableCell>
                        {item.service}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          item.saleDate,
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
                          {item.status}
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