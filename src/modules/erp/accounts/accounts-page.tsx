import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  CreditCard,
  ArrowUpRight,
  Banknote,
  FileText,
  Landmark,
  Loader2,
  MoreHorizontal,
  Package,
  Plus,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AccountSheet } from "./components/account-sheet";
import {
  getAccounts,
  type FinanceAccount,
} from "./accounts-service";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getAccountTypeLabel(
  type: FinanceAccount["type"],
) {
  switch (type) {
    case "bank":
      return "Bank";

    case "cash":
      return "Cash";

    case "mobile_banking":
      return "Mobile Banking";

    default:
      return type;
  }
}

function AccountsPage() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountSheetOpen, setAccountSheetOpen] =
    useState(false);

  async function loadAccounts() {
    try {
      setLoading(true);
      setError(null);

      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load accounts.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  const summary = useMemo(() => {
    return accounts.reduce(
      (result, account) => {
        result.total += account.currentBalance;

        if (account.type === "bank") {
          result.bank += account.currentBalance;
        }

        if (account.type === "cash") {
          result.cash += account.currentBalance;
        }

        if (account.type === "mobile_banking") {
          result.mobile += account.currentBalance;
        }

        return result;
      },
      {
        total: 0,
        bank: 0,
        cash: 0,
        mobile: 0,
      },
    );
  }, [accounts]);

  const accountCountLabel =
    accounts.length === 1 ? "account" : "accounts";

  return (
    <div className="flex h-full flex-col">
      {/* =========================================================
          PAGE HEADER
      ========================================================= */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">
            Accounts
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage your bank, cash, and mobile banking accounts.
          </p>
        </div>

        <Button
          onClick={() => setAccountSheetOpen(true)}
        >
          <Plus className="mr-2 size-4" />
          Add Account
        </Button>
      </div>

      {/* =========================================================
          CONTENT
      ========================================================= */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* =====================================================
                BALANCE SUMMARY
            ===================================================== */}
            <section>
              <div className="mb-3">
                <h2 className="text-sm font-semibold">
                  Overview
                </h2>

                <p className="text-xs text-muted-foreground">
                  Current balances across your financial accounts.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {/* Total Balance */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Wallet className="size-4" />
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {accounts.length} {accountCountLabel}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground">
                      Total Balance
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      {formatMoney(summary.total, "BDT")}
                    </p>
                  </CardContent>
                </Card>

                {/* Bank */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Landmark className="size-4" />
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground">
                      Bank
                    </p>

                    <p className="mt-1 text-xl font-semibold">
                      {formatMoney(summary.bank, "BDT")}
                    </p>
                  </CardContent>
                </Card>

                {/* Cash */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Banknote className="size-4" />
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground">
                      Cash
                    </p>

                    <p className="mt-1 text-xl font-semibold">
                      {formatMoney(summary.cash, "BDT")}
                    </p>
                  </CardContent>
                </Card>

                {/* Mobile Banking */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Wallet className="size-4" />
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground">
                      Mobile Banking
                    </p>

                    <p className="mt-1 text-xl font-semibold">
                      {formatMoney(summary.mobile, "BDT")}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* =====================================================
                FINANCE OPERATIONS
            ===================================================== */}
            <section>
              <div className="mb-3">
                <h2 className="text-sm font-semibold">
                  Finance Operations
                </h2>

                <p className="text-xs text-muted-foreground">
                  Manage sales, invoices, transactions, and party accounts.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {/* Sales */}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/app/accounts/sales")
                  }
                  className="group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <ShoppingCart className="size-4" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <p className="mt-3 font-medium">
                    Sales
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Record customer sales and service revenue.
                  </p>
                </button>

                {/* Invoices */}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/app/accounts/invoices")
                  }
                  className="group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <FileText className="size-4" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <p className="mt-3 font-medium">
                    Invoices
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Create and manage customer invoices.
                  </p>
                </button>
                  {/* Receivables */}
<button
  type="button"
  onClick={() =>
    navigate("/app/accounts/receivables")
  }
  className="group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
>
  <div className="flex items-start justify-between">
    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
      <ArrowDownLeft className="size-4" />
    </div>

    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
  </div>

  <p className="mt-3 font-medium">
    Receivables
  </p>

  <p className="mt-1 text-xs text-muted-foreground">
    Track money owed by customers.
  </p>
</button>
{/* Payables */}
<button
  type="button"
  onClick={() =>
    navigate("/app/accounts/payables")
  }
  className="group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
>
  <div className="flex items-start justify-between">
    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
      <CreditCard className="size-4" />
    </div>

    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
  </div>

  <p className="mt-3 font-medium">
    Payables
  </p>

  <p className="mt-1 text-xs text-muted-foreground">
    Track money owed to vendors.
  </p>
</button>
                {/* Transactions */}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/app/accounts/transactions")
                  }
                  className="group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <ReceiptText className="size-4" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <p className="mt-3 font-medium">
                    Transactions
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    View and manage financial transactions.
                  </p>
                </button>

                {/* Party Accounts */}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/app/accounts/parties")
                  }
                  className="group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Users className="size-4" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <p className="mt-3 font-medium">
                    Party Accounts
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Manage agents, vendors, and customers.
                  </p>
                </button>
              </div>
            </section>

            {/* =====================================================
                ASSETS
            ===================================================== */}
            <section>
              <div className="mb-3">
                <h2 className="text-sm font-semibold">
                  Assets
                </h2>

                <p className="text-xs text-muted-foreground">
                  Track business assets and investments separately from cash.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {/* Investments */}
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/app/accounts/assets/investments",
                    )
                  }
                  className="group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <TrendingUp className="size-4" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <p className="mt-3 font-medium">
                    Investments
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Track shares, deposits, and other investments.
                  </p>
                </button>

                {/* Visa Inventory */}
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/app/accounts/assets/visa-inventory",
                    )
                  }
                  className="group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Package className="size-4" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <p className="mt-3 font-medium">
                    Visa Inventory
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Manage purchased visas held as business assets.
                  </p>
                </button>
              </div>
            </section>

            {/* =====================================================
                PEOPLE & COSTS
            ===================================================== */}
            <section>
              <div className="mb-3">
                <h2 className="text-sm font-semibold">
                  People & Costs
                </h2>

                <p className="text-xs text-muted-foreground">
                  Manage payroll and recurring business costs.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {/* Payroll */}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/app/accounts/payroll")
                  }
                  className="group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Users className="size-4" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <p className="mt-3 font-medium">
                    Payroll
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Manage employee salary and payments.
                  </p>
                </button>

                {/* Fixed Costs */}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/app/accounts/fixed-costs")
                  }
                  className="group rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <ReceiptText className="size-4" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <p className="mt-3 font-medium">
                    Fixed Costs
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Manage rent, utilities, and recurring costs.
                  </p>
                </button>
              </div>
            </section>

            {/* =====================================================
                YOUR ACCOUNTS
            ===================================================== */}
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="text-sm font-semibold">
                    Your Accounts
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Bank, cash, and mobile banking balances.
                  </p>
                </div>

                <span className="text-xs text-muted-foreground">
                  {accounts.length} {accountCountLabel}
                </span>
              </div>

              {accounts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Landmark className="size-5 text-muted-foreground" />
                  </div>

                  <h3 className="mt-4 font-medium">
                    No accounts yet
                  </h3>

                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    Add your first bank, cash, or mobile banking
                    account to start managing your finances.
                  </p>

                  <Button
                    className="mt-4"
                    onClick={() =>
                      setAccountSheetOpen(true)
                    }
                  >
                    <Plus className="mr-2 size-4" />
                    Add Account
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {accounts.map((account) => (
                    <Card
                      key={account.id}
                      className="transition-shadow hover:shadow-sm"
                    >
                      <CardHeader className="flex flex-row items-start justify-between pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/40">
                            {account.type === "bank" ? (
                              <Landmark className="size-5" />
                            ) : account.type === "cash" ? (
                              <Banknote className="size-5" />
                            ) : (
                              <Wallet className="size-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <CardTitle className="truncate text-base">
                              {account.name}
                            </CardTitle>

                            <p className="text-xs text-muted-foreground">
                              {getAccountTypeLabel(account.type)}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </CardHeader>

                      <CardContent>
                        <p className="text-2xl font-semibold">
                          {formatMoney(
                            account.currentBalance,
                            account.currency,
                          )}
                        </p>

                        <div className="mt-3 flex items-center justify-between border-t pt-3">
                          {account.accountNumber ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {account.accountNumber}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No account number
                            </p>
                          )}

                          <span className="text-xs text-muted-foreground">
                            {account.currency}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* =========================================================
          ACCOUNT SHEET
      ========================================================= */}
      <AccountSheet
        open={accountSheetOpen}
        onOpenChange={setAccountSheetOpen}
        onCreated={loadAccounts}
      />
    </div>
  );
}

export { AccountsPage };
