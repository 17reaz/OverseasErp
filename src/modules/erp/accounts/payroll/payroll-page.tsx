// src/modules/erp/finance/payroll/payroll-page.tsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";

import {
  getPayrollRecords,
} from "./payroll-service";
import { PayrollSheet } from "./payroll-sheet";
import { PayrollEmployees } from "./payroll-employees";
import type {
  PayrollRecord,
} from "./payroll-service";

/* =========================================================
 * HELPERS
 * ========================================================= */

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatMonth(value: string) {
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
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

/* =========================================================
 * PAGE
 * ========================================================= */

function PayrollPage() {
  const navigate = useNavigate();

  const [
    payroll,
    setPayroll,
  ] = useState<PayrollRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");
const [sheetOpen, setSheetOpen] =
  useState(false);
  const [employeesOpen, setEmployeesOpen] =
  useState(false);
  /* =======================================================
   * LOAD
   * ======================================================= */

  async function loadPayroll(
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
        await getPayrollRecords();

      setPayroll(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load payroll.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadPayroll();
  }, []);

  /* =======================================================
   * FILTER
   * ======================================================= */

  const filteredPayroll =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return payroll;
      }

      return payroll.filter(
        (item) =>
          item.employeeName
            .toLowerCase()
            .includes(query) ||
          item.employeeCode
            ?.toLowerCase()
            .includes(query) ||
          item.designation
            ?.toLowerCase()
            .includes(query) ||
          item.payrollMonth
            .toLowerCase()
            .includes(query),
      );
    }, [payroll, search]);

  /* =======================================================
   * SUMMARY
   * ======================================================= */

  const summary = useMemo(() => {
    const total = payroll.reduce(
      (sum, item) =>
        sum + item.netSalary,
      0,
    );

    const paid = payroll
      .filter(
        (item) =>
          item.status === "paid",
      )
      .reduce(
        (sum, item) =>
          sum + item.netSalary,
        0,
      );

    const pending = payroll
      .filter(
        (item) =>
          item.status === "pending",
      )
      .reduce(
        (sum, item) =>
          sum + item.netSalary,
        0,
      );

    return {
      total,
      paid,
      pending,
    };
  }, [payroll]);

  /* =======================================================
   * COLUMNS
   * ======================================================= */

  const columns:
    DataTableColumn<PayrollRecord>[] =
    [
      {
        key: "payrollMonth",
        header: "Month",
        cell: (item) =>
          formatMonth(
            item.payrollMonth,
          ),
      },

      {
        key: "employee",
        header: "Employee",
        cell: (item) => (
          <div className="min-w-[180px]">
            <div className="font-medium">
              {item.employeeName}
            </div>

            {(item.employeeCode ||
              item.designation) && (
              <div className="text-xs text-muted-foreground">
                {item.employeeCode ?? ""}

                {item.employeeCode &&
                item.designation
                  ? " • "
                  : ""}

                {item.designation ?? ""}
              </div>
            )}
          </div>
        ),
      },

      {
        key: "basicSalary",
        header: "Basic",
        cell: (item) =>
          formatMoney(
            item.basicSalary,
          ),
      },

      {
        key: "allowances",
        header: "Allowance",
        cell: (item) =>
          formatMoney(
            item.allowances,
          ),
      },

      {
        key: "deductions",
        header: "Deduction",
        cell: (item) =>
          formatMoney(
            item.deductions,
          ),
      },

      {
        key: "netSalary",
        header: "Net Salary",
        className: "text-right",
        cell: (item) => (
          <span className="font-semibold">
            {formatMoney(
              item.netSalary,
            )}
          </span>
        ),
      },

      {
        key: "status",
        header: "Status",
        cell: (item) => (
          <Badge
            variant={
              item.status === "paid"
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
              navigate("/app/accounts")
            }
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <h1 className="text-lg font-semibold">
              Payroll
            </h1>

            <p className="text-sm text-muted-foreground">
              Manage employee salaries
              and payroll payments.
            </p>
          </div>
        </div>

       <div className="flex items-center gap-2">
  <Button
    variant="outline"
    onClick={() => setEmployeesOpen(true)}
  >
    Employees
  </Button>

  <Button
    onClick={() => setSheetOpen(true)}
  >
    Add Payroll
  </Button>
</div>
      </div>

      {/* CONTENT */}

      <div className="flex-1 overflow-auto p-6">
        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              Total Payroll
            </div>

            <div className="mt-1 text-xl font-semibold">
              {formatMoney(
                summary.total,
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              Paid
            </div>

            <div className="mt-1 text-xl font-semibold">
              {formatMoney(
                summary.paid,
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              Pending
            </div>

            <div className="mt-1 text-xl font-semibold">
              {formatMoney(
                summary.pending,
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
            placeholder="Search employee or month..."
            className="sm:max-w-sm"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              void loadPayroll(true)
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
            data={filteredPayroll}
            getRowKey={(item) =>
              item.id
            }
            loading={loading}
            emptyTitle="No payroll records found"
            emptyDescription="No payroll records have been created yet."
          />
        )}
      </div>
      <PayrollSheet
  open={sheetOpen}
  onOpenChange={setSheetOpen}
  onCreated={() => {
    void loadPayroll(true);
  }}
/>
<Sheet
  open={employeesOpen}
  onOpenChange={setEmployeesOpen}
>
  <SheetContent
    side="right"
    className="w-full p-0 sm:max-w-6xl"
  >
    <PayrollEmployees />
  </SheetContent>
</Sheet>
    </div>
  );
}

export { PayrollPage };