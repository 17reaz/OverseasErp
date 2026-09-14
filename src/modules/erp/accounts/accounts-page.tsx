import { useEffect, useMemo, useState } from "react";
import {
  Landmark,
  Loader2,
  MoreHorizontal,
  Plus,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function getAccountTypeLabel(type: FinanceAccount["type"]) {
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
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const totalBalance = useMemo(
    () =>
      accounts.reduce(
        (total, account) => total + account.currentBalance,
        0,
      ),
    [accounts],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your bank, cash, and mobile banking accounts.
          </p>
        </div>

        <Button>
          <Plus className="mr-2 size-4" />
          Add Account
        </Button>
      </div>

      {/* Content */}
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
          <div className="space-y-6">
            {/* Total Balance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Balance
                </CardTitle>

                <Wallet className="size-5 text-muted-foreground" />
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-semibold">
                  {formatMoney(totalBalance, "BDT")}
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Across {accounts.length} active account
                  {accounts.length === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>

            {/* Accounts */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Your Accounts</h2>
                  <p className="text-sm text-muted-foreground">
                    Current balances by account.
                  </p>
                </div>
              </div>

              {accounts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <Landmark className="mx-auto mb-3 size-8 text-muted-foreground" />

                  <h3 className="font-medium">
                    No accounts found
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Add a bank, cash, or mobile banking account
                    to get started.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {accounts.map((account) => (
                    <Card key={account.id}>
                      <CardHeader className="flex flex-row items-start justify-between pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/40">
                            <Landmark className="size-5" />
                          </div>

                          <div>
                            <CardTitle className="text-base">
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
                          className="size-8"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </CardHeader>

                      <CardContent>
                        <div className="text-xl font-semibold">
                          {formatMoney(
                            account.currentBalance,
                            account.currency,
                          )}
                        </div>

                        {account.accountNumber && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {account.accountNumber}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { AccountsPage };