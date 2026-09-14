import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Account name is required.");
      return;
    }

    const balance = Number(openingBalance);

    if (!Number.isFinite(balance) || balance < 0) {
      setError("Opening balance must be a valid positive number.");
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create Account</SheetTitle>
          <SheetDescription>
            Add a bank, cash, or mobile banking account.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-1 py-5">
            {/* Account Name */}
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

            {/* Account Type */}
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

            {/* Account Number */}
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

            {/* Currency */}
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

            {/* Opening Balance */}
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

            {/* Balance Preview */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between tex
