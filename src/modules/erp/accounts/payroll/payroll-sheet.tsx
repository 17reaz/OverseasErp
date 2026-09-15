import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { Loader2 } from "lucide-react";

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
  createPayroll,
  type CreatePayrollInput,
} from "./payroll-service";

import {
  getAccounts,
  type FinanceAccount,
} from "../accounts-service";

interface PayrollSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}-01`;
}

export function PayrollSheet({
  open,
  onOpenChange,
  onCreated,
}: PayrollSheetProps) {
  const [employeeName, setEmployeeName] =
    useState("");

  const [employeeCode, setEmployeeCode] =
    useState("");

  const [designation, setDesignation] =
    useState("");

  const [payrollMonth, setPayrollMonth] =
    useState(getCurrentMonth());

  const [basicSalary, setBasicSalary] =
    useState("0");

  const [bonus, setBonus] =
    useState("0");

  const [allowances, setAllowances] =
    useState("0");

  const [deductions, setDeductions] =
    useState("0");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [accountId, setAccountId] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [accounts, setAccounts] =
    useState<FinanceAccount[]>([]);

  const [loadingAccounts, setLoadingAccounts] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * LOAD ACCOUNTS
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadAccounts() {
      try {
        setLoadingAccounts(true);

        const data = await getAccounts();

        if (!cancelled) {
          setAccounts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load accounts.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAccounts(false);
        }
      }
    }

    void loadAccounts();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /*
   * RESET
   */
  useEffect(() => {
    if (!open) {
      setEmployeeName("");
      setEmployeeCode("");
      setDesignation("");
      setPayrollMonth(getCurrentMonth());

      setBasicSalary("0");
      setBonus("0");
      setAllowances("0");
      setDeductions("0");

      setPaymentMethod("");
      setAccountId("");
      setNotes("");

      setError(null);
      setLoading(false);
    }
  }, [open]);

  /*
   * CALCULATION
   *
   * Basic + Bonus + Allowances - Deductions
   */
  const calculatedNetSalary = useMemo(() => {
    const basic = Number(basicSalary) || 0;
    const bonusAmount = Number(bonus) || 0;
    const allowanceAmount =
      Number(allowances) || 0;
    const deductionAmount =
      Number(deductions) || 0;

    return (
      basic +
      bonusAmount +
      allowanceAmount -
      deductionAmount
    );
  }, [
    basicSalary,
    bonus,
    allowances,
    deductions,
  ]);

  /*
   * HAS CHANGES
   */
  const hasChanges =
    employeeName.trim() !== "" ||
    employeeCode.trim() !== "" ||
    designation.trim() !== "" ||
    basicSalary !== "0" ||
    bonus !== "0" ||
    allowances !== "0" ||
    deductions !== "0" ||
    paymentMethod !== "" ||
    accountId !== "" ||
    notes.trim() !== "";

  /*
   * SUBMIT
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName =
      employeeName.trim();

    if (!trimmedName) {
      setError("Employee name is required.");
      return;
    }

    if (!payrollMonth) {
      setError("Payroll month is required.");
      return;
    }

    const basic = Number(basicSalary);
    const bonusAmount = Number(bonus);
    const allowanceAmount =
      Number(allowances);
    const deductionAmount =
      Number(deductions);

    if (
      !Number.isFinite(basic) ||
      basic < 0
    ) {
      setError(
        "Basic salary must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isFinite(bonusAmount) ||
      bonusAmount < 0
    ) {
      setError(
        "Bonus must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isFinite(allowanceAmount) ||
      allowanceAmount < 0
    ) {
      setError(
        "Allowances must be a valid non-negative number.",
      );
      return;
    }

    if (
      !Number.isFinite(deductionAmount) ||
      deductionAmount < 0
    ) {
      setError(
        "Deductions must be a valid non-negative number.",
      );
      return;
    }

    if (calculatedNetSalary < 0) {
      setError(
        "Net salary cannot be negative.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input: CreatePayrollInput = {
        employeeName: trimmedName,

        employeeCode:
          employeeCode.trim() || null,

        designation:
          designation.trim() || null,

        payrollMonth,

        basicSalary: basic,

        bonus: bonusAmount,

        allowances: allowanceAmount,

        deductions: deductionAmount,

        paymentMethod:
          paymentMethod || null,

        accountId:
          accountId || null,

        notes:
          notes.trim() || null,
      };

      await createPayroll(input);

      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create payroll.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Payroll"
      description="Create a monthly payroll record for an employee."
      onSubmit={handleSubmit}
      loading={loading}
      disabled={!employeeName.trim()}
      submitLabel="Create Payroll"
      hasChanges={hasChanges}
    >
      <div className="space-y-8">
        {/* EMPLOYEE */}
        <FormSection
          title="Employee"
          description="Enter the employee information for this payroll record."
        >
          <div className="space-y-2">
            <Label htmlFor="payroll-employee-name">
              Employee Name
            </Label>

            <Input
              id="payroll-employee-name"
              placeholder="e.g. Md. Rahim"
              value={employeeName}
              onChange={(event) =>
                setEmployeeName(
                  event.target.value,
                )
              }
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payroll-employee-code">
              Employee Code
              <span className="ml-1 text-muted-foreground">
                (optional)
              </span>
            </Label>

            <Input
              id="payroll-employee-code"
              placeholder="e.g. EMP-001"
              value={employeeCode}
              onChange={(event) =>
                setEmployeeCode(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payroll-designation">
              Designation
              <span className="ml-1 text-muted-foreground">
                (optional)
              </span>
            </Label>

            <Input
              id="payroll-designation"
              placeholder="e.g. Manager"
              value={designation}
              onChange={(event) =>
                setDesignation(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payroll-month">
              Payroll Month
            </Label>

            <Input
              id="payroll-month"
              type="month"
              value={
                payrollMonth
                  ? payrollMonth.slice(0, 7)
                  : ""
              }
              onChange={(event) =>
                setPayrollMonth(
                  event.target.value
                    ? `${event.target.value}-01`
                    : "",
                )
              }
            />
          </div>
        </FormSection>

        {/* SALARY */}
        <FormSection
          title="Salary"
          description="Enter the employee's salary components."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payroll-basic">
                Basic Salary
              </Label>

              <Input
                id="payroll-basic"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={basicSalary}
                onChange={(event) =>
                  setBasicSalary(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payroll-bonus">
                Bonus
              </Label>

              <Input
                id="payroll-bonus"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={bonus}
                onChange={(event) =>
                  setBonus(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payroll-allowances">
                Allowances
              </Label>

              <Input
                id="payroll-allowances"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={allowances}
                onChange={(event) =>
                  setAllowances(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payroll-deductions">
                Deductions
              </Label>

              <Input
                id="payroll-deductions"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={deductions}
                onChange={(event) =>
                  setDeductions(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          {/* NET SALARY PREVIEW */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Net Salary
                </p>

                <p className="text-xs text-muted-foreground">
                  Basic + Bonus + Allowances −
                  Deductions
                </p>
              </div>

              <span className="text-lg font-semibold">
                ৳
                {calculatedNetSalary.toLocaleString(
                  "en-BD",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}
              </span>
            </div>
          </div>
        </FormSection>

        {/* PAYMENT */}
        <FormSection
          title="Payment"
          description="Payment details can be added now or when the payroll is paid."
        >
          <div className="space-y-2">
            <Label>Payment Method</Label>

            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="bank_transfer">
                  Bank Transfer
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
            <Label>Account</Label>

            <Select
              value={accountId}
              onValueChange={setAccountId}
              disabled={loadingAccounts}
            >
              <SelectTrigger>
                {loadingAccounts ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span>
                      Loading accounts...
                    </span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select payment account" />
                )}
              </SelectTrigger>

              <SelectContent>
                {accounts.length === 0 ? (
                  <SelectItem
                    value="__no_accounts__"
                    disabled
                  >
                    No active accounts found
                  </SelectItem>
                ) : (
                  accounts.map((account) => (
                    <SelectItem
                      key={account.id}
                      value={account.id}
                    >
                      {account.name}
                      {" — "}
                      {account.type ===
                      "mobile_banking"
                        ? "Mobile Banking"
                        : account.type ===
                            "bank"
                          ? "Bank"
                          : "Cash"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              Select the account from which the
              salary will be paid.
            </p>
          </div>
        </FormSection>

        {/* NOTES */}
        <FormSection
          title="Notes"
          description="Add any additional payroll information."
        >
          <div className="space-y-2">
            <Label htmlFor="payroll-notes">
              Notes
            </Label>

            <textarea
              id="payroll-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Optional notes..."
              rows={4}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </FormSection>

        {/* ERROR */}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </UniversalSheet>
  );
}