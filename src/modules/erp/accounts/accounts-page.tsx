import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
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
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

/* =========================================================
 * NAVIGATION TILES (presentation only — same routes as before)
 * ========================================================= */

interface NavItem {
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

const FINANCE_OPERATIONS: NavItem[] = [
  {
    label: "Accounting Requests",
    description: "Review and approve ERP requests.",
    path: "/app/accounts/requests",
    icon: ReceiptText,
  },
  {
    label: "Sales",
    description: "Customer sales and service revenue.",
    path: "/app/accounts/sales",
    icon: ShoppingCart,
  },
  {
    label: "Invoices",
    description: "Create and manage invoices.",
    path: "/app/accounts/invoices",
    icon: FileText,
  },
  {
    label: "Receivables",
    description: "Money owed by customers.",
    path: "/app/accounts/receivables",
    icon: ArrowDownLeft,
  },
  {
    label: "Payables",
    description: "Money owed to vendors.",
    path: "/app/accounts/payables",
    icon: CreditCard,
  },
  {
    label: "Transactions",
    description: "View financial transactions.",
    path: "/app/accounts/transactions",
    icon: ReceiptText,
  },
  {
    label: "Party Accounts",
    description: "Agents, vendors, and customers.",
    path: "/app/accounts/parties",
    icon: Users,
  },
];

const ASSETS: NavItem[] = [
  {
    label: "Investments",
    description: "Shares, deposits, and more.",
    path: "/app/accounts/assets/investments",
    icon: TrendingUp,
  },
  {
    label: "Visa Inventory",
    description: "Visas held as business assets.",
    path: "/app/accounts/assets/visa-inventory",
    icon: Package,
  },
];

const PEOPLE_AND_COSTS: NavItem[] = [
  {
    label: "Payroll",
    description: "Employee salary and payments.",
    path: "/app/accounts/payroll",
    icon: Users,
  },
  {
    label: "Fixed Costs",
    description: "Rent, utilities, recurring costs.",
    path: "/app/accounts/fixed-costs",
    icon: ReceiptText,
  },
];

function NavTile({
  item,
  onOpen,
}: {
  item: NavItem;
  onOpen: (path: string) => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen(item.path)}
      className="group flex min-w-0 items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          {item.label}
        </p>

        <p className="truncate text-xs text-muted-foreground">
          {item.description}
        </p>
      </div>

      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-2 text-sm font-semibold">{children}</h2>
  );
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

  const summaryCards = [
    {
      label: "Total Balance",
      value: summary.total,
      icon: Wallet,
      hint: `${accounts.length} ${accountCountLabel}`,
    },
    {
      label: "Bank",
      value: summary.bank,
      icon: Landmark,
      hint: null,
    },
    {
      label: "Cash",
      value: summary.cash,
      icon: Banknote,
      hint: null,
    },
    {
      label: "Mobile Banking",
      value: summary.mobile,
      icon: Wallet,
      hint: null,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* =========================================================
          PAGE HEADER
      ========================================================= */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">Accounts</h1>

          <p className="text-sm text-muted-foreground">
            Manage your bank, cash, and mobile banking accounts.
          </p>
        </div>

        <Button onClick={() => setAccountSheetOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add Account
        </Button>
      </div>

      {/* =========================================================
          CONTENT
          - mobile/tablet: normal page scroll (fallback)
          - desktop (lg+): fits the screen, no page scroll
      ========================================================= */}
      <div className="flex min-h-0 flex-1 flex-col p-4 lg:overflow-hidden">
        {loading ? (
          <div className="flex min-h-60 flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {/* =====================================================
                BALANCE SUMMARY
            ===================================================== */}
            <section className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;

                return (
                  <Card key={card.label}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-muted-foreground">
                          {card.label}
                        </p>

                        <p className="truncate text-lg font-semibold leading-tight">
                          {formatMoney(card.value, "BDT")}
                        </p>
                      </div>

                      {card.hint && (
                        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                          {card.hint}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            {/* =====================================================
                MAIN: left = navigation, right = accounts list
            ===================================================== */}
            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
              {/* ---------- LEFT: NAVIGATION ---------- */}
              <div className="flex min-h-0 flex-col gap-4 lg:overflow-auto [scrollbar-width:none]">
                <section>
                  <SectionTitle>Finance Operations</SectionTitle>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {FINANCE_OPERATIONS.map((item) => (
                      <NavTile
                        key={item.path}
                        item={item}
                        onOpen={navigate}
                      />
                    ))}
                  </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                  <section>
                    <SectionTitle>Assets</SectionTitle>

                    <div className="grid gap-2">
                      {ASSETS.map((item) => (
                        <NavTile
                          key={item.path}
                          item={item}
                          onOpen={navigate}
                        />
                      ))}
                    </div>
                  </section>

                  <section>
                    <SectionTitle>People & Costs</SectionTitle>

                    <div className="grid gap-2">
                      {PEOPLE_AND_COSTS.map((item) => (
                        <NavTile
                          key={item.path}
                          item={item}
                          onOpen={navigate}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* ---------- RIGHT: YOUR ACCOUNTS ---------- */}
              <section className="flex min-h-0 flex-col rounded-lg border bg-card">
                <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
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
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Landmark className="size-5 text-muted-foreground" />
                    </div>

                    <h3 className="mt-3 font-medium">
                      No accounts yet
                    </h3>

                    <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                      Add your first bank, cash, or mobile banking
                      account to start managing your finances.
                    </p>

                    <Button
                      className="mt-4"
                      onClick={() => setAccountSheetOpen(true)}
                    >
                      <Plus className="mr-2 size-4" />
                      Add Account
                    </Button>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3 [scrollbar-width:thin]">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                          {account.type === "bank" ? (
                            <Landmark className="size-4" />
                          ) : account.type === "cash" ? (
                            <Banknote className="size-4" />
                          ) : (
                            <Wallet className="size-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {account.name}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            {getAccountTypeLabel(account.type)}
                            {" · "}
                            {account.accountNumber ||
                              "No account number"}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-semibold">
                          {formatMoney(
                            account.currentBalance,
                            account.currency,
                          )}
                        </p>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
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
