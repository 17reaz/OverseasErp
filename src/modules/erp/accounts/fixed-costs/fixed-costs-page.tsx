// src/modules/erp/accounts/fixed-costs/fixed-costs-page.tsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { toast } from "@/components/shared/toast/toast";

import { ConfirmDialog } from "@/modules/erp/shared/ui/confirm-dialog";

import {
  deleteFixedCost,
  duplicateFixedCost,
  getFixedCostAccounts,
  getFixedCosts,
  markFixedCostPaid,
  updateFixedCostStatus,
} from "./fixed-costs-service";

import type {
  FixedCost,
  FixedCostAccount,
  FixedCostFrequencyFilter,
  FixedCostStatusFilter,
} from "./fixed-costs-types";

import {
  buildSummary,
  getDueState,
} from "./fixed-costs-utils";

import { FixedCostsSummary } from "./components/fixed-costs-summary";
import { FixedCostsToolbar } from "./components/fixed-costs-toolbar";
import { FixedCostsTable } from "./components/fixed-costs-table";
import { FixedCostSheet } from "./components/fixed-cost-sheet";
import { FixedCostDetailsSheet } from "./components/fixed-cost-details-sheet";

function FixedCostsPage() {
  const navigate = useNavigate();

  const [fixedCosts, setFixedCosts] =
    useState<FixedCost[]>([]);

  const [accounts, setAccounts] = useState<
    FixedCostAccount[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  /* FILTERS */

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<FixedCostStatusFilter>("all");

  const [
    frequencyFilter,
    setFrequencyFilter,
  ] =
    useState<FixedCostFrequencyFilter>(
      "all",
    );

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  /* SHEETS */

  const [sheetOpen, setSheetOpen] =
    useState(false);

  const [editingCost, setEditingCost] =
    useState<FixedCost | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [selectedCost, setSelectedCost] =
    useState<FixedCost | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<FixedCost | null>(null);

  /* =======================================================
   * LOAD
   * ======================================================= */

  const loadData = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const [costList, accountList] =
          await Promise.all([
            getFixedCosts(),
            getFixedCostAccounts(),
          ]);

        setFixedCosts(costList);
        setAccounts(accountList);
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
    },
    [],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =======================================================
   * DERIVED
   * ======================================================= */

  const categories = useMemo(() => {
    const unique = new Set(
      fixedCosts
        .map((cost) => cost.category)
        .filter(Boolean),
    );

    return Array.from(unique).sort();
  }, [fixedCosts]);

  const summary = useMemo(
    () => buildSummary(fixedCosts),
    [fixedCosts],
  );

  const filteredCosts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return fixedCosts
      .filter((cost) => {
        if (
          statusFilter !== "all" &&
          cost.status !== statusFilter
        ) {
          return false;
        }

        if (
          frequencyFilter !== "all" &&
          cost.frequency !==
            frequencyFilter
        ) {
          return false;
        }

        if (
          categoryFilter !== "all" &&
          cost.category !== categoryFilter
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          cost.name,
          cost.category,
          cost.vendor ?? "",
          cost.paymentMethod ?? "",
          cost.account?.name ?? "",
          cost.notes ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        // Overdue গুলো সবসময় উপরে
        const aOverdue =
          getDueState(a) === "overdue"
            ? 0
            : 1;

        const bOverdue =
          getDueState(b) === "overdue"
            ? 0
            : 1;

        if (aOverdue !== bOverdue) {
          return aOverdue - bOverdue;
        }

        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return a.dueDate.localeCompare(
          b.dueDate,
        );
      });
  }, [
    fixedCosts,
    search,
    statusFilter,
    frequencyFilter,
    categoryFilter,
  ]);

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    frequencyFilter !== "all" ||
    categoryFilter !== "all";

  /* =======================================================
   * MUTATIONS
   * ======================================================= */

  function upsertCost(saved: FixedCost) {
    setFixedCosts((current) => {
      const exists = current.some(
        (item) => item.id === saved.id,
      );

      if (exists) {
        return current.map((item) =>
          item.id === saved.id
            ? saved
            : item,
        );
      }

      return [saved, ...current];
    });

    setSelectedCost((current) =>
      current?.id === saved.id
        ? saved
        : current,
    );
  }

  function handleCreate() {
    setEditingCost(null);
    setSheetOpen(true);
  }

  function handleEdit(cost: FixedCost) {
    setDetailsOpen(false);
    setEditingCost(cost);
    setSheetOpen(true);
  }

  function handleView(cost: FixedCost) {
    setSelectedCost(cost);
    setDetailsOpen(true);
  }

  async function handleMarkPaid(
    cost: FixedCost,
  ) {
    try {
      const saved =
        await markFixedCostPaid(cost.id);

      upsertCost(saved);

      toast.success(
        "Marked as paid",
        `${cost.name} has been marked as paid.`,
      );
    } catch (err) {
      toast.error(
        "Failed to update",
        err instanceof Error
          ? err.message
          : "Could not mark this cost as paid.",
      );
    }
  }

  async function handleCancel(
    cost: FixedCost,
  ) {
    try {
      const saved =
        await updateFixedCostStatus(
          cost.id,
          "cancelled",
        );

      upsertCost(saved);

      toast.success(
        "Cost cancelled",
        `${cost.name} is no longer counted in your run rate.`,
      );
    } catch (err) {
      toast.error(
        "Failed to update",
        err instanceof Error
          ? err.message
          : "Could not cancel this cost.",
      );
    }
  }

  async function handleDuplicate(
    cost: FixedCost,
  ) {
    try {
      const saved =
        await duplicateFixedCost(cost);

      upsertCost(saved);

      toast.success(
        "Next cycle created",
        `A new pending entry was created for ${cost.name}.`,
      );
    } catch (err) {
      toast.error(
        "Failed to duplicate",
        err instanceof Error
          ? err.message
          : "Could not duplicate this cost.",
      );
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;

    setDeleteTarget(null);

    try {
      await deleteFixedCost(target.id);

      setFixedCosts((current) =>
        current.filter(
          (item) => item.id !== target.id,
        ),
      );

      setDetailsOpen(false);
      setSelectedCost(null);

      toast.success(
        "Fixed cost deleted",
        `${target.name} has been removed.`,
      );
    } catch (err) {
      toast.error(
        "Failed to delete",
        err instanceof Error
          ? err.message
          : "Could not delete this cost.",
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setFrequencyFilter("all");
    setCategoryFilter("all");
  }

  /* =======================================================
   * RENDER
   * ======================================================= */

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}

      <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
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
            <h1 className="text-lg font-semibold">
              Fixed Costs
            </h1>

            <p className="text-sm text-muted-foreground">
              Manage recurring business
              expenses and fixed costs.
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <FixedCostsSummary
            summary={summary}
            loading={loading}
          />

          <FixedCostsToolbar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={
              setStatusFilter
            }
            frequencyFilter={
              frequencyFilter
            }
            onFrequencyFilterChange={
              setFrequencyFilter
            }
            categoryFilter={
              categoryFilter
            }
            onCategoryFilterChange={
              setCategoryFilter
            }
            categories={categories}
            refreshing={refreshing}
            onRefresh={() =>
              void loadData(true)
            }
            onCreate={handleCreate}
          />

          {hasActiveFilters && (
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {filteredCosts.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {fixedCosts.length}
                </span>{" "}
                fixed costs
              </p>

              <button
                type="button"
                className="text-sm font-medium hover:underline"
                onClick={resetFilters}
              >
                Clear filters
              </button>
            </div>
          )}

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <FixedCostsTable
              fixedCosts={filteredCosts}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onMarkPaid={(cost) =>
                void handleMarkPaid(cost)
              }
              onCancel={(cost) =>
                void handleCancel(cost)
              }
              onDuplicate={(cost) =>
                void handleDuplicate(cost)
              }
            />
          )}
        </div>
      </div>

      {/* CREATE / EDIT */}

      <FixedCostSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);

          if (!open) {
            setEditingCost(null);
          }
        }}
        fixedCost={editingCost}
        accounts={accounts}
        onSuccess={(saved) => {
          upsertCost(saved);

          toast.success(
            editingCost
              ? "Fixed cost updated"
              : "Fixed cost added",
            saved.name,
          );
        }}
      />

      {/* DETAILS */}

      <FixedCostDetailsSheet
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);

          if (!open) {
            setSelectedCost(null);
          }
        }}
        fixedCost={selectedCost}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        onMarkPaid={(cost) =>
          void handleMarkPaid(cost)
        }
      />

      {/* DELETE CONFIRM */}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete fixed cost?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          void handleConfirmDelete()
        }
      />
    </div>
  );
}

export { FixedCostsPage };
