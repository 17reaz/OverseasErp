// src/modules/erp/finance/components/finance-expenses.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";
import { UniversalSheet } from "../../shared/forms/universal-sheet";
import { FormSection } from "../../shared/forms/form-section";
import {
  FormDate,
  FormInput,
  FormSelect,
  FormTextarea,
} from "../../shared/ui/form-field";

import { FinanceToolbar } from "./finance-toolbar";

import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../finance-service";

import { formatCurrency, formatDate, expenseStatusClass } from "../finance-utils";

import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUS_OPTIONS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
} from "../finance-constants";

import type {
  ExpenseStatus,
  FinanceExpense,
  PaymentMethod,
} from "../finance-types";

interface ExpenseFormValues {
  date: string;
  category: string;
  vendor: string;
  description: string;
  amount: string;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
}

function emptyValues(): ExpenseFormValues {
  return {
    date: new Date().toISOString().slice(0, 10),
    category: EXPENSE_CATEGORIES[0],
    vendor: "",
    description: "",
    amount: "",
    paymentMethod: "cash",
    status: "paid",
  };
}

function toValues(expense: FinanceExpense): ExpenseFormValues {
  return {
    date: expense.date,
    category: expense.category,
    vendor: expense.vendor,
    description: expense.description ?? "",
    amount: String(expense.amount),
    paymentMethod: expense.paymentMethod,
    status: expense.status,
  };
}

export function FinanceExpenses() {
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "all">(
    "all",
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceExpense | null>(null);
  const [values, setValues] = useState<ExpenseFormValues>(emptyValues());
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setExpenses(await getExpenses());
    } catch (error) {
      console.error("Failed to load expenses:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!query) return true;
      return (
        e.vendor.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      );
    });
  }, [expenses, search, statusFilter]);

  function set<K extends keyof ExpenseFormValues>(
    key: K,
    value: ExpenseFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleCreate() {
    setEditing(null);
    setValues(emptyValues());
    setSheetOpen(true);
  }

  function handleEdit(expense: FinanceExpense) {
    setEditing(expense);
    setValues(toValues(expense));
    setSheetOpen(true);
  }

  async function handleDelete(expense: FinanceExpense) {
    const confirmed = window.confirm(`Delete expense "${expense.vendor}"?`);
    if (!confirmed) return;

    try {
      await deleteExpense(expense.id);
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  }

  async function handleMarkPaid(expense: FinanceExpense) {
    try {
      const saved = await updateExpense(expense.id, { status: "paid" });
      applySaved(saved);
    } catch (error) {
      console.error("Failed to mark expense as paid:", error);
    }
  }

  function applySaved(saved: FinanceExpense) {
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === saved.id);
      if (exists) return prev.map((e) => (e.id === saved.id ? saved : e));
      return [saved, ...prev];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.vendor || !values.amount) return;

    setSaving(true);

    try {
      const payload = {
        date: values.date,
        category: values.category,
        vendor: values.vendor,
        description: values.description || null,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
        status: values.status,
      };

      const saved = editing
        ? await updateExpense(editing.id, payload)
        : await createExpense(payload);

      applySaved(saved);
      setSheetOpen(false);
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setSaving(false);
    }
  }

  const columns: DataTableColumn<FinanceExpense>[] = [
    {
      key: "date",
      header: "Date",
      className: "whitespace-nowrap",
      cell: (row) => formatDate(row.date),
    },
    {
      key: "vendor",
      header: "Vendor",
      cell: (row) => (
        <div className="max-w-[180px]">
          <p className="truncate font-medium">{row.vendor}</p>
          {row.description && (
            <p className="truncate text-xs text-muted-foreground">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      cell: (row) => row.category,
    },
    {
      key: "paymentMethod",
      header: "Method",
      hideOnMobile: true,
      cell: (row) => PAYMENT_METHOD_LABELS[row.paymentMethod],
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right whitespace-nowrap",
      cell: (row) => (
        <span className="font-semibold text-destructive">
          -{formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${expenseStatusClass(row.status)}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      className: "w-[60px] text-right",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>

            {row.status !== "paid" && (
              <DropdownMenuItem onClick={() => handleMarkPaid(row)}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDelete(row)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FinanceToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search vendor, category, description..."
        onRefresh={() => {
          setRefreshing(true);
          void loadData();
        }}
        refreshing={refreshing}
        onCreate={handleCreate}
        createLabel="Add Expense"
      >
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as ExpenseStatus | "all")
          }
        >
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {EXPENSE_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FinanceToolbar>

      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(row) => row.id}
        loading={loading}
        emptyTitle="No expenses found"
        emptyDescription="Log an expense to get started."
        pageSize={10}
      />

      <UniversalSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit Expense" : "Add Expense"}
        description="Dummy data — nothing is persisted to a database yet."
        onSubmit={handleSubmit}
        loading={saving}
        submitLabel={editing ? "Save Changes" : "Add Expense"}
      >
        <FormSection title="Expense details">
          <div className="grid grid-cols-2 gap-4">
            <FormDate
              label="Date"
              required
              value={values.date}
              onChange={(e) => set("date", e.target.value)}
            />

            <FormSelect
              label="Category"
              required
              value={values.category}
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
              onValueChange={(value) => set("category", value)}
            />
          </div>

          <FormInput
            label="Vendor"
            required
            value={values.vendor}
            onChange={(e) => set("vendor", e.target.value)}
          />

          <FormTextarea
            label="Description"
            description="Optional"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Amount"
              type="number"
              required
              min={0}
              value={values.amount}
              onChange={(e) => set("amount", e.target.value)}
            />

            <FormSelect
              label="Payment Method"
              required
              value={values.paymentMethod}
              options={PAYMENT_METHOD_OPTIONS}
              onValueChange={(value) =>
                set("paymentMethod", value as PaymentMethod)
              }
            />
          </div>

          <FormSelect
            label="Status"
            required
            value={values.status}
            options={EXPENSE_STATUS_OPTIONS}
            onValueChange={(value) => set("status", value as ExpenseStatus)}
          />
        </FormSection>
      </UniversalSheet>
    </div>
  );
}
