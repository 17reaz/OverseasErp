// src/modules/erp/accounting/transactions/transaction-page.tsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  deleteTransaction,
  getTransactionAccounts,
  getTransactionCategories,
  getTransactionParties,
  getTransactions,
} from "./transaction-service";

import type {
  Transaction,
  TransactionAccount,
  TransactionCategory,
  TransactionParty,
} from "./transaction-types";

import {
  TransactionToolbar,
} from "./components/transaction-toolbar";

import {
  TransactionTable,
} from "./components/transaction-table";

import {
  TransactionSheet,
} from "./components/transaction-sheet";

import {
  TransactionDetailsSheet,
} from "./components/transaction-details-sheet";

export function TransactionsPage() {
  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>([]);

  const [
    accounts,
    setAccounts,
  ] = useState<TransactionAccount[]>([]);

  const [
    categories,
    setCategories,
  ] = useState<TransactionCategory[]>([]);

  const [
    parties,
    setParties,
  ] = useState<TransactionParty[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState<
    "all" | "income" | "expense"
  >("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    | "all"
    | "pending"
    | "completed"
    | "cancelled"
  >("all");

  const [
    accountFilter,
    setAccountFilter,
  ] = useState("all");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    partyFilter,
    setPartyFilter,
  ] = useState("all");

  const [
    sheetOpen,
    setSheetOpen,
  ] = useState(false);

  const [
    editingTransaction,
    setEditingTransaction,
  ] =
    useState<Transaction | null>(
      null,
    );

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] =
    useState<Transaction | null>(
      null,
    );

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  /* =======================================================
   * LOAD
   * ======================================================= */

  const loadData =
    useCallback(async () => {
      try {
        setRefreshing(true);

        const [
          transactionList,
          accountList,
          categoryList,
          partyList,
        ] = await Promise.all([
          getTransactions(),
          getTransactionAccounts(),
          getTransactionCategories(),
          getTransactionParties(),
        ]);

        setTransactions(
          transactionList,
        );

        setAccounts(accountList);
        setCategories(
          categoryList,
        );
        setParties(partyList);
      } catch (error) {
        console.error(
          "Failed to load accounting transactions:",
          error,
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =======================================================
   * FILTER
   * ======================================================= */

  const filteredTransactions =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {
          if (
            typeFilter !==
              "all" &&
            transaction.type !==
              typeFilter
          ) {
            return false;
          }

          if (
            statusFilter !==
              "all" &&
            transaction.status !==
              statusFilter
          ) {
            return false;
          }

          if (
            accountFilter !==
              "all" &&
            transaction.accountId !==
              accountFilter
          ) {
            return false;
          }

          if (
            categoryFilter !==
              "all" &&
            transaction.categoryId !==
              categoryFilter
          ) {
            return false;
          }

          if (
            partyFilter !==
              "all" &&
            transaction.partyId !==
              partyFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable = [
            transaction.description ??
              "",
            transaction.reference ??
              "",
            transaction.account
              ?.name ?? "",
            transaction.category
              ?.name ?? "",
            transaction.party
              ?.name ?? "",
            transaction.party
              ?.partyType ?? "",
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query,
          );
        },
      );
    }, [
      transactions,
      search,
      typeFilter,
      statusFilter,
      accountFilter,
      categoryFilter,
      partyFilter,
    ]);

  /* =======================================================
   * CREATE
   * ======================================================= */

  function handleCreate() {
    setEditingTransaction(null);
    setSheetOpen(true);
  }

  /* =======================================================
   * EDIT
   * ======================================================= */

  function handleEdit(
    transaction: Transaction,
  ) {
    setDetailsOpen(false);
    setEditingTransaction(
      transaction,
    );
    setSheetOpen(true);
  }

  /* =======================================================
   * VIEW
   * ======================================================= */

  function handleView(
    transaction: Transaction,
  ) {
    setSelectedTransaction(
      transaction,
    );
    setDetailsOpen(true);
  }

  /* =======================================================
   * DELETE
   * ======================================================= */

  async function handleDelete(
    transaction: Transaction,
  ) {
    const confirmed =
      window.confirm(
        `Delete transaction "${
          transaction.description ??
          "Untitled transaction"
        }"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteTransaction(
        transaction.id,
      );

      setTransactions(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              transaction.id,
          ),
      );

      setDetailsOpen(false);
      setSelectedTransaction(
        null,
      );
    } catch (error) {
      console.error(
        "Failed to delete transaction:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to delete transaction.",
      );
    }
  }

  /* =======================================================
   * SAVE SUCCESS
   * ======================================================= */

  function handleSuccess(
    saved: Transaction,
  ) {
    setTransactions(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.id ===
              saved.id,
          );

        if (exists) {
          return current.map(
            (item) =>
              item.id === saved.id
                ? saved
                : item,
          );
        }

        return [
          saved,
          ...current,
        ];
      },
    );
  }

  /* =======================================================
   * RESET FILTERS
   * ======================================================= */

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setAccountFilter("all");
    setCategoryFilter("all");
    setPartyFilter("all");
  }

  return (
    <div className="space-y-4">
      {/* =================================================
       * TOOLBAR
       * ================================================= */}

      <TransactionToolbar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={
          setTypeFilter
        }
        statusFilter={
          statusFilter
        }
        onStatusFilterChange={
          setStatusFilter
        }
        refreshing={refreshing}
        onRefresh={() =>
          void loadData()
        }
        onCreate={handleCreate}
      >
        {/* Account */}

        <Select
          value={accountFilter}
          onValueChange={
            setAccountFilter
          }
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Account" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All accounts
            </SelectItem>

            {accounts.map(
              (account) => (
                <SelectItem
                  key={account.id}
                  value={account.id}
                >
                  {account.name}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        {/* Category */}

        <Select
          value={categoryFilter}
          onValueChange={
            setCategoryFilter
          }
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All categories
            </SelectItem>

            {categories.map(
              (category) => (
                <SelectItem
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        {/* Related */}

        <Select
          value={partyFilter}
          onValueChange={
            setPartyFilter
          }
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Related" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All related
            </SelectItem>

            {parties.map(
              (party) => (
                <SelectItem
                  key={party.id}
                  value={party.id}
                >
                  {party.name}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </TransactionToolbar>

      {/* =================================================
       * ACTIVE FILTER INFO
       * ================================================= */}

      {(search ||
        typeFilter !== "all" ||
        statusFilter !== "all" ||
        accountFilter !== "all" ||
        categoryFilter !== "all" ||
        partyFilter !== "all") && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {
                filteredTransactions.length
              }
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {transactions.length}
            </span>{" "}
            transactions
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

      {/* =================================================
       * TABLE
       * ================================================= */}

      <TransactionTable
        transactions={
          filteredTransactions
        }
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* =================================================
       * CREATE / EDIT
       * ================================================= */}

      <TransactionSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);

          if (!open) {
            setEditingTransaction(
              null,
            );
          }
        }}
        transaction={
          editingTransaction
        }
        accounts={accounts}
        categories={categories}
        parties={parties}
        onSuccess={
          handleSuccess
        }
      />

      {/* =================================================
       * DETAILS
       * ================================================= */}

      <TransactionDetailsSheet
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);

          if (!open) {
            setSelectedTransaction(
              null,
            );
          }
        }}
        transaction={
          selectedTransaction
        }
        onEdit={handleEdit}
        onDelete={
          handleDelete
        }
      />
    </div>
  );
}