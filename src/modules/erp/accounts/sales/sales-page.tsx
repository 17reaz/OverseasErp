import {
  ArrowLeft,
  Plus,
  Search,
  ShoppingCart,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Badge,
} from "@/components/ui/badge";

import {
  SaleSheet,
} from "./components/sale-sheet";

import type {
  CreateSaleInput,
  Sale,
  SaleStatus,
} from "./sales-types";

const initialSales: Sale[] = [
  {
    id: "sale-001",
    customerName: "Rahim Ahmed",
    service: "Visa Processing",
    amount: 120000,
    saleDate: "2026-09-16",
    status: "paid",
    notes: "",
  },
  {
    id: "sale-002",
    customerName: "Karim Hasan",
    service: "Recruitment Processing",
    amount: 85000,
    saleDate: "2026-09-15",
    status: "confirmed",
    notes: "",
  },
  {
    id: "sale-003",
    customerName: "Sakib Khan",
    service: "Medical Processing",
    amount: 15000,
    saleDate: "2026-09-14",
    status: "paid",
    notes: "",
  },
  {
    id: "sale-004",
    customerName: "Nayeem Islam",
    service: "Flight Processing",
    amount: 65000,
    saleDate: "2026-09-12",
    status: "draft",
    notes: "",
  },
];

function formatAmount(
  amount: number,
) {
  return new Intl.NumberFormat(
    "en-BD",
    {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

function getStatusLabel(
  status: SaleStatus,
) {
  switch (status) {
    case "draft":
      return "Draft";

    case "confirmed":
      return "Confirmed";

    case "paid":
      return "Paid";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

function getStatusVariant(
  status: SaleStatus,
) {
  switch (status) {
    case "paid":
      return "default" as const;

    case "confirmed":
      return "secondary" as const;

    case "cancelled":
      return "destructive" as const;

    case "draft":
    default:
      return "outline" as const;
  }
}

export function SalesPage() {
  const navigate = useNavigate();

  const [
    sales,
    setSales,
  ] = useState<Sale[]>(initialSales);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    sheetOpen,
    setSheetOpen,
  ] = useState(false);

  const filteredSales = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch =
        !query ||
        sale.customerName
          .toLowerCase()
          .includes(query) ||
        sale.service
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        sale.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    sales,
    search,
    statusFilter,
  ]);

  const totalSales = useMemo(
    () =>
      sales
        .filter(
          (sale) =>
            sale.status !== "cancelled",
        )
        .reduce(
          (sum, sale) =>
            sum + sale.amount,
          0,
        ),
    [sales],
  );

  const paidSales = useMemo(
    () =>
      sales
        .filter(
          (sale) =>
            sale.status === "paid",
        )
        .reduce(
          (sum, sale) =>
            sum + sale.amount,
          0,
        ),
    [sales],
  );

  const pendingSales = useMemo(
    () =>
      sales
        .filter(
          (sale) =>
            sale.status ===
              "confirmed" ||
            sale.status === "draft",
        )
        .reduce(
          (sum, sale) =>
            sum + sale.amount,
          0,
        ),
    [sales],
  );

  const handleCreateSale = (
    input: CreateSaleInput,
  ) => {
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      ...input,
    };

    setSales((current) => [
      newSale,
      ...current,
    ]);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                navigate("/app/accounts")
              }
            >
              <ArrowLeft className="size-4" />
            </Button>

            <div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-5" />

                <h1 className="text-lg font-semibold">
                  Sales
                </h1>
              </div>

              <p className="text-sm text-muted-foreground">
                Record and manage customer sales.
              </p>
            </div>
          </div>

          <Button
            onClick={() =>
              setSheetOpen(true)
            }
          >
            <Plus className="mr-2 size-4" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Total Sales
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {formatAmount(totalSales)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Paid
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {formatAmount(paidSales)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {formatAmount(pendingSales)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search customer or service..."
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={
                setStatusFilter
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All Status
                </SelectItem>

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

          {/* Sales table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium">
                        Customer
                      </th>

                      <th className="px-4 py-3 text-left font-medium">
                        Service
                      </th>

                      <th className="px-4 py-3 text-right font-medium">
                        Amount
                      </th>

                      <th className="px-4 py-3 text-left font-medium">
                        Date
                      </th>

                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSales.map(
                      (sale) => (
                        <tr
                          key={sale.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-3 font-medium">
                            {sale.customerName}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            {sale.service}
                          </td>

                          <td className="px-4 py-3 text-right font-medium">
                            {formatAmount(
                              sale.amount,
                            )}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            {sale.saleDate}
                          </td>

                          <td className="px-4 py-3">
                            <Badge
                              variant={getStatusVariant(
                                sale.status,
                              )}
                            >
                              {getStatusLabel(
                                sale.status,
                              )}
                            </Badge>
                          </td>
                        </tr>
                      ),
                    )}

                    {filteredSales.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-sm text-muted-foreground"
                        >
                          No sales found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SaleSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCreate={handleCreateSale}
      />
    </div>
  );
}