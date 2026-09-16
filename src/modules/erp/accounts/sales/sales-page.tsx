import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Search,
  ShoppingCart,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SaleSheet } from "./components/sale-sheet";
import {
  createSale,
  getSales,
  updateSale,
} from "./sales-service";

import type {
  CreateSaleInput,
  Sale,
  SaleStatus,
  UpdateSaleInput,
} from "./sales-types";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusLabel(status: SaleStatus) {
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

function getStatusVariant(status: SaleStatus) {
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

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [sheetOpen, setSheetOpen] =
    useState(false);

  const [selectedSale, setSelectedSale] =
    useState<Sale | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSales() {
      try {
        setLoading(true);
        setError(null);

        const data = await getSales();

        if (mounted) {
          setSales(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load sales.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadSales();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredSales = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

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

  const activeSales = useMemo(
    () =>
      sales.filter(
        (sale) =>
          sale.status !== "cancelled",
      ),
    [sales],
  );

  const totalSales = useMemo(
    () =>
      activeSales.reduce(
        (sum, sale) =>
          sum + sale.amount,
        0,
      ),
    [activeSales],
  );

  const paidSales = useMemo(
    () =>
      activeSales.reduce(
        (sum, sale) =>
          sum + sale.paidAmount,
        0,
      ),
    [activeSales],
  );

  const pendingSales = useMemo(
    () =>
      activeSales.reduce(
        (sum, sale) =>
          sum + sale.dueAmount,
        0,
      ),
    [activeSales],
  );

  const grossProfit = useMemo(
    () =>
      activeSales.reduce(
        (sum, sale) =>
          sum + sale.grossProfit,
        0,
      ),
    [activeSales],
  );

  const handleNewSale = () => {
    setSelectedSale(null);
    setSheetOpen(true);
  };

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
    setSheetOpen(true);
  };

  const handleCreateSale = async (
    input: CreateSaleInput,
  ) => {
    const createdSale =
      await createSale(input);

    setSales((current) => [
      createdSale,
      ...current,
    ]);
  };

  const handleUpdateSale = async (
    saleId: string,
    input: UpdateSaleInput,
  ) => {
    const updatedSale =
      await updateSale(
        saleId,
        input,
      );

    setSales((current) =>
      current.map((sale) =>
        sale.id === saleId
          ? updatedSale
          : sale,
      ),
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* =====================================================
          HEADER
      ===================================================== */}
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
            onClick={handleNewSale}
          >
            <Plus className="mr-2 size-4" />
            New Sale
          </Button>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* =================================================
              SUMMARY
          ================================================= */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Sales */}
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

            {/* Paid */}
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

            {/* Pending */}
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

            {/* Gross Profit */}
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Gross Profit
                </p>

                <p
                  className={`mt-2 text-2xl font-semibold ${
                    grossProfit < 0
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {formatAmount(grossProfit)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* =================================================
              TOOLBAR
          ================================================= */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
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

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
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

          {/* =================================================
              SALES TABLE
          ================================================= */}
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

                      <th className="px-4 py-3 text-right font-medium">
                        Paid
                      </th>

                      <th className="px-4 py-3 text-right font-medium">
                        Due
                      </th>

                      <th className="px-4 py-3 text-right font-medium">
                        Profit
                      </th>

                      <th className="px-4 py-3 text-left font-medium">
                        Date
                      </th>

                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>

                      <th className="px-4 py-3 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* Loading */}
                    {loading && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-12 text-center text-sm text-muted-foreground"
                        >
                          Loading sales...
                        </td>
                      </tr>
                    )}

                    {/* Rows */}
                    {!loading &&
                      filteredSales.map((sale) => (
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

                          <td className="px-4 py-3 text-right">
                            {formatAmount(
                              sale.paidAmount,
                            )}
                          </td>

                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {formatAmount(
                              sale.dueAmount,
                            )}
                          </td>

                          <td
                            className={`px-4 py-3 text-right font-medium ${
                              sale.grossProfit < 0
                                ? "text-destructive"
                                : ""
                            }`}
                          >
                            {formatAmount(
                              sale.grossProfit,
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

                          {/* Action */}
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() =>
                                handleEditSale(
                                  sale,
                                )
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}

                    {/* Empty */}
                    {!loading &&
                      filteredSales.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
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

      {/* =====================================================
          SALE SHEET
      ===================================================== */}
      <SaleSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);

          if (!open) {
            setSelectedSale(null);
          }
        }}
        sale={selectedSale}
        onCreate={handleCreateSale}
        onUpdate={handleUpdateSale}
      />
    </div>
  );
}
