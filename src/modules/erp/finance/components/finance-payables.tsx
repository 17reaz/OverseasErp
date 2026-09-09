// src/modules/erp/finance/components/finance-payables.tsx

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
  createPayable,
  deletePayable,
  getPayables,
  updatePayable,
} from "../finance-service";

import { formatCurrency, formatDate, payableStatusClass } from "../finance-utils";

import {
  EXPENSE_CATEGORIES,
  PAYABLE_STATUS_OPTIONS,
} from "../finance-constants";

import type { FinancePayable, PayableStatus } from "../finance-types";

interface PayableFormValues {
  vendor: string;
  category: string;
  dueDate: string;
  amount: string;
  paidAmount: string;
  status: PayableStatus;
  notes: string;
}

function emptyValues(): PayableFormValues {
  const due = new Date();
  due.setDate(due.getDate() + 14);

  return {
    vendor: "",
    category: EXPENSE_CATEGORIES[0],
    dueDate: due.toISOString().slice(0, 10),
    amount: "",
    paidAmount: "0",
    status: "pending",
    notes: "",
  };
}

function toValues(payable: FinancePayable): PayableFormValues {
  return {
    vendor: payable.vendor,
    category: payable.category,
    dueDate: payable.dueDate,
    amount: String(payable.amount),
    paidAmount: String(payable.paidAmount),
    status: payable.status,
    notes: payable.notes ?? "",
  };
}

export function FinancePayables() {
  const [payables, setPayables] = useState<FinancePayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayableStatus | "all">(
    "all",
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<FinancePayable | null>(null);
  const [values, setValues] = useState<PayableFormValues>(emptyValues());
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setPayables(await getPayables());
    } catch (error) {
      console.error("Failed to load payables:", error);
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

    return payables.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!query) return true;
      return (
        p.vendor.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    });
  }, [payables, search, statusFilter]);

  function set<K extends keyof PayableFormValues>(
    key: K,
    value: PayableFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleCreate() {
    setEditing(null);
    setValues(emptyValues());
    setSheetOpen(true);
  }

  function handleEdit(payable: FinancePayable) {
    setEditing(payable);
    setValues(toValues(payable));
    setSheetOpen(true);
  }

  async function handleDelete(payable: FinancePayable) {
    const confirmed = window.confirm(`Delete payable to ${payable.vendor}?`);
    if (!confirmed) return;

    try {
      await deletePayable(payable.id);
      setPayables((prev) => prev.filter((p) => p.id !== payable.id));
    } catch (error) {
      console.error("Failed to delete payable:", error);
    }
  }

  async function handleMarkPaid(payable: FinancePayable) {
    try {
      const saved = await updatePayable(payable.id, {
        status: "paid",
        paidAmount: payable.amount,
      });
      applySaved(saved);
    } catch (error) {
      console.error("Failed to mark payable as paid:", error);
    }
  }

  function applySaved(saved: FinancePayable) {
    setPayables((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      if (exists) return prev.map((p) => (p.id === saved.id ? saved : p));
      return [saved, ...prev];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.vendor || !values.amount) return;

    setSaving(true);

    try {
      const payload = {
        vendor: values.vendor,
        category: values.category,
        dueDate: values.dueDate,
        amount: Number(values.amount),
        paidAmount: Number(values.paidAmount || 0),
        status: values.status,
        notes: values.notes || null,
      };

      const saved = editing
        ? await updatePayable(editing.id, payload)
        : await createPayable(payload);

      applySaved(saved);
      setSheetOpen(false);
    } catch (error) {
      console.error("Failed to save payable:", error);
    } finally {
      setSaving(false);
    }
  }

  const columns: DataTableColumn<FinancePayable>[] = [
    {
      key: "vendor",
      header: "Vendor",
      cell: (row) => <span className="font-medium">{row.vendor}</span>,
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      cell: (row) => row.category,
    },
    {
      key: "dueDate",
      header: "Due",
      className: "whitespace-nowrap",
      cell: (row) => formatDate(row.dueDate),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right whitespace-nowrap",
      cell: (row) => formatCurrency(row.amount),
    },
    {
      key: "balance",
      header: "Balance",
      className: "text-right whitespace-nowrap",
      hideOnMobile: true,
      cell: (row) => formatCurrency(Math.max(row.amount - row.paidAmount, 0)),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${payableStatusClass(row.status)}`}
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
        searchPlaceholder="Search vendor or category..."
        onRefresh={() => {
          setRefreshing(true);
          void loadData();
        }}
        refreshing={refreshing}
        onCreate={handleCreate}
        createLabel="Add Payable"
      >
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as PayableStatus | "all")
          }
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PAYABLE_STATUS_OPTIONS.map((option) => (
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
        emptyTitle="No payables found"
        emptyDescription="Bills you owe will show up here."
        pageSize={10}
      />

      <UniversalSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit Payable" : "Add Payable"}
        description="Dummy data — nothing is persisted to a database yet."
        onSubmit={handleSubmit}
        loading={saving}
        submitLabel={editing ? "Save Changes" : "Add Payable"}
      >
        <FormSection title="Payable details">
          <FormInput
            label="Vendor"
            required
            value={values.vendor}
            onChange={(e) => set("vendor", e.target.value)}
            placeholder="Who is this owed to?"
          />

          <FormSelect
            label="Category"
            required
            value={values.category}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            onValueChange={(value) => set("category", value)}
          />

          <FormDate
            label="Due Date"
            required
            value={values.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
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

            <FormInput
              label="Paid Amount"
              type="number"
              min={0}
              value={values.paidAmount}
              onChange={(e) => set("paidAmount", e.target.value)}
            />
          </div>

          <FormSelect
            label="Status"
            required
            value={values.status}
            options={PAYABLE_STATUS_OPTIONS}
            onValueChange={(value) => set("status", value as PayableStatus)}
          />

          <FormTextarea
            label="Notes"
            description="Optional"
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </FormSection>
      </UniversalSheet>
    </div>
  );
}
