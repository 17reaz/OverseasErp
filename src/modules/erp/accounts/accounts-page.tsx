import { WalletCards } from "lucide-react";

function AccountsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/40">
            <WalletCards className="size-5" />
          </div>

          <div>
            <h1 className="text-lg font-semibold">Accounts</h1>
            <p className="text-sm text-muted-foreground">
              Manage your accounts, transactions, and financial records.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts module is under development.
          </p>
        </div>
      </div>
    </div>
  );
}

export { AccountsPage };