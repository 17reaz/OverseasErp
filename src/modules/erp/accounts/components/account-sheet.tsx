import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet";
import { FormSection } from "@/modules/erp/shared/forms/form-section";

import {
  createAccount,
  type AccountType,
} from "../accounts-service";

interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function AccountSheet({
  open,
  onOpenChange,
  onCreated,
}: AccountSheetProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [openingBalance, setOpeningBalance] = useState("0");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setType("bank");
      setAccountNumber("");
      setCurrency("BDT");
      setOpeningBalance("0");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const hasChanges =
    name.trim() !== "" ||
    type !== "bank" ||
    accountNumber.trim() !== "" ||
    currency !== "BDT" ||
    openingBalance !== "0";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Account name is required.");
      return;
    }

    const balance = Number(openingBalance);

    if (!Number.isFinite(balance) || balance < 0) {
      setError("Opening balance must be a valid non-negative number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createAccount({
        name: trimmedName,
        type,
        accountNumber: accountNumber.trim() || null,
        currency,
        openingBalance: balance,
      });

      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create account.",
      );
    } finally {
      setLoading(false);
    }
  }

  const previewBalance = Number(openingBalance);

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Create Account"
      description="Add a bank, cash, or mobile banking account."
      onSubmit={handleSubmit}
      loading={loading}
      disabled={!name.trim()}
      submitLabel="Create Account"
      hasChanges={hasChanges}
    >
      <div className="space-y-8">
        <FormSection
          title="Account Details"
          description="Set up the account that will be used for your agency's financial transactions."
        >
          <div className="space-y-2">
            <Label htmlFor="account-name">
              Account Name
            </Label>

            <Input
              id="account-name"
              placeholder="e.g. DBBL Bank"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Account Type</Label>

            <Select
              value={type}
              onValueChange={(value) =>
                setType(value as AccountType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="bank">
                  Bank
                </SelectItem>

                <SelectItem value="cash">
                  Cash
                </SelectItem>

                <SelectItem value="mobile_banking">
                  Mobile Banking
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-number">
              Account Number
              <span className="ml-1 text-muted-foreground">
                (optional)
              </span>
            </Label>

            <Input
              id="account-number"
              placeholder="e.g. 1234567890"
              value={accountNumber}
              onChange={(event) =>
                setAccountNumber(event.target.value)
              }
            />
          </div>
        </FormSection>

        <FormSection
          title="Opening Balance"
          description="The opening balance becomes the account's starting current balance."
        >
          <div className="space-y-2">
            <Label>Currency</Label>

            <Select
              value={currency}
              onValueChange={setCurrency}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="BDT">
                  BDT — Bangladeshi Taka
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening-balance">
              Opening Balance
            </Label>

            <Input
              id="opening-balance"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={openingBalance}
              onChange={(event) =>
                setOpeningBalance(event.target.value)
              }
            />

            <p className="text-xs text-muted-foreground">
              Current balance will start from this amount.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Starting Balance
              </span>

              <span className="font-semibold">
                ৳
                {Number.isFinite(previewBalance)
                  ? previewBalance.toLocaleString("en-BD", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "0.00"}
              </span>
            </div>
          </div>
        </FormSection>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </UniversalSheet>
  );
}
