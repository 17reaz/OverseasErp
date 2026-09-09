// src/modules/erp/finance/components/finance-receivables.tsx

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
  createReceivable,
  deleteReceivable,
  getReceivables,
  updateReceivable,
} from "../finance-service";

import {
  formatCurrency,
  formatDate,
  receivableStatusClass,
} from "../finance-utils";

import {
  RECEIVABLE_SOURCES,
  RECEIVABLE_STATUS_OPTIONS,
} from "../finance-constants";

import type { FinanceReceivable, ReceivableStatus } from "../finance-types";

/* =========================================================
   FORM VALUES
========================================================= */

interface ReceivableFormValues {
  from: string;
  source: string;
  dueDate: string;
  amount: string;
  receivedAmount: string;
  status: ReceivableStatus;
  notes: string;
}

function emptyValues(): ReceivableFormValues {
  const due = new Date();
  due.setDate(due.getDate() + 14);

  return {
    from: "",
    source: RECEIVABLE_SOURCES[0],
    dueDate: due.toISOString().slice(0, 10),
    amount: "",
    receivedAmount: "0",
    status: "pending",
    notes: "",
  };
}

function toValues(receivable: FinanceReceivable): ReceivableFormValues {
  return {
    from: receivable.from,
    source: receivable.source,
    dueDate: receivable.dueDate,
    amount: String(receivable.amount),
    receivedAmount: String(receivable.receivedAmount),
    status: receivable.status,
    notes: receivable.notes ?? "",
  };
}

export function FinanceReceivables() {
  const [receivables, setReceivables] = useState<FinanceReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReceivableStatus | "all">(
    "all",
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceReceivable | null>(null);
  const [values, setValues] = useState<ReceivableFormValues>(emptyValues());
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setReceivables(await getReceivables());
    } catch (error) {
      console.error("Failed to load receivables:", error);
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

    return receivables.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!query) return true;
      return (
        r.from.toLowerCase().includes(query) ||
        r.source.toLowerCase().includes(query)
      );
    });
  }, [receivables, search, statusFilter]);

  function set<K extends keyof ReceivableFormValues>(
    key: K,
    value: ReceivableFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleCreate() {
    setEditing(null);
    setValues(emptyValues());
    setSheetOpen(true);
  }

  function handleEdit(receivable: FinanceReceivable) {
    setEditing(receivable);
    setValues(toValues(receivable));
    setSheetOpen(true);
  }

  async function handleDelete(receivable: FinanceReceivable) {
    const confirmed = window.confirm(`Delete receivable from ${receivable.from}?`);
    if (!confirmed) return;

    try {
      await deleteReceivable(receivable.id);
      setReceivables((prev) => prev.filter((r) => r.id !== receivable.id));
    } catch (error) {
      console.error("Failed to delete receivable:", error);
    }
  }

  async function handleMarkReceived(receivable: FinanceReceivable) {
    try {
      const saved = await updateReceivable(receivable.id, {
        status: "received",
        receivedAmount: receivable.amount,
      });
      applySaved(saved);
    } catch (error) {
      console.error("Failed to mark receivable as received:", error);
    }
  }

  function applySaved(saved: FinanceReceivable) {
    setReceivables((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      if (exists) return prev.map((r) => (r.id === saved.id ? saved : r));
      return [saved, ...prev];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.from || !values.amount) return;

    setSaving(true);

    try {
      const payload = {
        from: values.from,
        source: values.source,
        dueDate: values.dueDate,
        amount: Number(values.amount),
        receivedAmount: Number(values.receivedAmount || 0),
        status: values.status,
        notes: values.notes || null,
      };

      const saved = editing
        ? await updateReceivable(editing.id, payload)
        : await createReceivable(payload);

      applySaved(saved);
      setSheetOpen(false);
    } catch (error) {
      console.error("Failed to save receivable:", error);
    } finally {
      setSaving(false);
    }
  }

  const columns: DataTableColumn<FinanceReceivable>[] = [
    {
      key: "from",
      header: "From",
      cell: (row) => <span className="font-medium">{row.from}</span>,
    },
    {
      key: "source",
      header: "Source",
      hideOnMobile: true,
      cell: (row) => row.source,
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
      cell: (row) =>
        formatCurrency(Math.max(row.amount - row.receivedAmount, 0)),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${receivableStatusClass(row.status)}`}
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

            {row.status !== "received" && (
              <DropdownMenuItem onClick={() => handleMarkReceived(row)}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Received
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
        searchPlaceholder="Search source or name..."
        onRefresh={() => {
          setRefreshing(true);
          void loadData();
        }}
        refreshing={refreshing}
        onCreate={handleCreate}
        createLabel="Add Receivable"
      >
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as ReceivableStatus | "all")
          }
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {RECEIVABLE_STATUS_OPTIONS.map((option) => (
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
        emptyTitle="No receivables found"
        emptyDescription="Amounts owed to you will show up here."
        pageSize={10}
      />

      <UniversalSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit Receivable" : "Add Receivable"}
        description="Dummy data — nothing is persisted to a database yet."
        onSubmit={handleSubmit}
        loading={saving}
        submitLabel={editing ? "Save Changes" : "Add Receivable"}
      >
        <FormSection title="Receivable details">
          <FormInput
            label="From"
            required
            value={values.from}
            onChange={(e) => set("from", e.target.value)}
            placeholder="Candidate or agent name"
          />

          <FormSelect
            label="Source"
            required
            value={values.source}
            options={RECEIVABLE_SOURCES.map((s) => ({ value: s, label: s }))}
            onValueChange={(value) => set("source", value)}
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
              label="Received Amount"
              type="number"
              min={0}
              value={values.receivedAmount}
              onChange={(e) => set("receivedAmount", e.target.value)}
            />
          </div>

          <FormSelect
            label="Status"
            required
            value={values.status}
            options={RECEIVABLE_STATUS_OPTIONS}
            onValueChange={(value) => set("status", value as ReceivableStatus)}
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
