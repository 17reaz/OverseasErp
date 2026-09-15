// src/modules/erp/finance/fixed-costs/fixed-costs-page.tsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";

import {
  getFixedCosts,
} from "./fixed-costs-service";

import type {
  FixedCost,
  FixedCostFrequency,
} from "./fixed-costs-service";

/* =========================================================
 * HELPERS
 * ========================================================= */

function formatMoney(
  amount: number,
) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatFrequency(
  frequency: FixedCostFrequency,
) {
  switch (frequency) {
    case "monthly":
      return "Monthly";

    case "quarterly":
      return "Quarterly";

    case "yearly":
      return "Yearly";

    case "custom":
      return "Custom";

    default:
      return frequency;
  }
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

/* =========================================================
 * PAGE
 * ========================================================= */

function FixedCostsPage() {
  const navigate = useNavigate();

  const [
    fixedCosts,
    setFixedCosts,
  ] = useState<FixedCost[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  /* =======================================================
   * LOAD
   * ======================================================= */

  async function loadFixedCosts(
    showRefresh = false,
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data =
        await getFixedCosts();

      setFixedCosts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load fixed costs.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadFixedCosts();
  }, []);

  /* =======================================================
   * FILTER
   * ======================================================= */

  const filteredFixedCosts =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return fixedCosts;
      }

      return fixedCosts.filter(
        (item) =>
          item.name
            .toLowerCase()
            .includes(query) ||
          item.description
            ?.toLowerCase()
            .includes(query) ||
          item.frequency
            .toLowerCase()
            .includes(query),
      );
    }, [
      fixedCosts,
      search,
    ]);

  /* =======================================================
   * SUMMARY
   * ======================================================= */

  const summary = useMemo(() => {
    const activeCosts =
      fixedCosts.filter(
        (item) =>
          item.status === "active",
      );

    const monthlyEquivalent =
      activeCosts.reduce(
        (total, item) => {
          switch (item.frequency) {
            case "monthly":
              return total + item.amount;

            case "quarterly":
              return (
                total +
                item.amount / 3
              );

            case "yearly":
              return (
                total +
                item.amount / 12
              );

            default:
              return total;
          }
        },
        0,
      );

    return {
      activeCount:
        activeCosts.length,

      monthlyEquivalent,
    };
  }, [fixedCosts]);

  /* =======================================================
   * COLUMNS
   * ======================================================= */

  const columns:
    DataTableColumn<FixedCost>[] =
    [
      {
        key: "name",
        header: "Cost",
        cell: (item) => (
          <div className="min-w-[180px]">
            <div className="font-medium">
              {item.name}
            </div>

            {item.description && (
              <div className="text-xs text-muted-foreground">
                {item.description}
              </div>
            )}
          </div>
        ),
      },

      {
        key: "amount",
        header: "Amount",
        cell: (item) => (
          <span className="font-medium">
            {formatMoney(
              item.amount,
            )}
          </span>
        ),
      },

      {
        key: "frequency",
        header: "Frequency",
        cell: (item) =>
          formatFrequency(
            item.frequency,
          ),
      },

      {
        key: "nextDueDate",
        header: "Next Due",
        cell: (item) =>
          formatDate(
            item.nextDueDate,
          ),
      },

      {
        key: "status",
        header: "Status",
        cell: (item) => (
          <Badge
            variant={
              item.status === "active"
                ? "default"
                : item.status ===
                    "cancelled"
                  ? "destructive"
                  : "outline"
            }
          >
            {item.status}
          </Badge>
        ),
      },
    ];

  /* =======================================================
   * RENDER
   * ======================================================= */

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}

      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate("/app/finance")
            }
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <h1 className="text-lg font-semibold">
              Fixed Costs
            </h1>

            <p className="text-sm text-muted-foreground">
              Manage recurring business
              expenses and fixed costs.
            </p>
          </div>
        </div>

        <Button disabled>
          Add Fixed Cost
        </Button>
      </div>

      {/* CONTENT */}

      <div className="flex-1 overflow-auto p-6">
        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              Active Costs
            </div>

            <div className="mt-1 text-xl font-semibold">
              {summary.activeCount}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              Estimated Monthly Cost
            </div>

            <div className="mt-1 text-xl font-semibold">
              {formatMoney(
                summary.monthlyEquivalent,
              )}
            </div>
          </div>
        </div>

        {/* TOOLBAR */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search fixed costs..."
            className="sm:max-w-sm"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              void loadFixedCosts(
                true,
              )
            }
            disabled={refreshing}
          >
            <RefreshCw
              className={
                refreshing
                  ? "size-4 animate-spin"
                  : "size-4"
              }
            />
          </Button>
        </div>

        {/* ERROR */}

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={
              filteredFixedCosts
            }
            getRowKey={(item) =>
              item.id
            }
            loading={loading}
            emptyTitle="No fixed costs found"
            emptyDescription="No recurring or fixed business costs have been recorded yet."
          />
        )}
      </div>
    </div>
  );
}

export { FixedCostsPage };
