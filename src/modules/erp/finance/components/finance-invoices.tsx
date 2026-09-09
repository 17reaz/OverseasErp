// src/modules/erp/finance/components/finance-invoices.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
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

import { FinanceToolbar } from "./finance-toolbar";
import { FinanceInvoiceForm } from "./finance-invoice-form";

import {
  deleteInvoice,
  getInvoices,
  updateInvoice,
} from "../finance-service";

import { formatCurrency, formatDate, invoiceStatusClass } from "../finance-utils";
import { INVOICE_STATUS_OPTIONS } from "../finance-constants";

import type { FinanceInvoice, InvoiceStatus } from "../finance-types";

export function FinanceInvoices() {
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all",
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<FinanceInvoice | null>(
    null,
  );

  const loadData = useCallback(async () => {
    try {
      setInvoices(await getInvoices());
    } catch (error) {
      console.error("Failed to load invoices:", error);
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

    return invoices.filter((invoice) => {
      if (statusFilter !== "all" && invoice.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      return (
        invoice.invoiceNo.toLowerCase().includes(query) ||
        invoice.billTo.toLowerCase().includes(query) ||
        invoice.agent?.toLowerCase().includes(query)
      );
    });
  }, [invoices, search, statusFilter]);

  function handleCreate() {
    setEditingInvoice(null);
    setFormOpen(true);
  }

  function handleEdit(invoice: FinanceInvoice) {
    setEditingInvoice(invoice);
    setFormOpen(true);
  }

  async function handleDelete(invoice: FinanceInvoice) {
    const confirmed = window.confirm(`Delete invoice ${invoice.invoiceNo}?`);
    if (!confirmed) return;

    try {
      await deleteInvoice(invoice.id);
      setInvoices((prev) => prev.filter((i) => i.id !== invoice.id));
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  }

  async function handleMarkPaid(invoice: FinanceInvoice) {
    try {
      const saved = await updateInvoice(invoice.id, {
        status: "paid",
        paidAmount: invoice.amount,
      });
      handleSuccess(saved);
    } catch (error) {
      console.error("Failed to mark invoice as paid:", error);
    }
  }

  function handleSuccess(saved: FinanceInvoice) {
    setInvoices((prev) => {
      const exists = prev.some((i) => i.id === saved.id);
      if (exists) return prev.map((i) => (i.id === saved.id ? saved : i));
      return [saved, ...prev];
    });
  }

  const columns: DataTableColumn<FinanceInvoice>[] = [
    {
      key: "invoiceNo",
      header: "Invoice",
      className: "font-mono text-xs font-semibold",
      cell: (row) => row.invoiceNo,
    },
    {
      key: "billTo",
      header: "Bill To",
      cell: (row) => (
        <div className="max-w-[180px]">
          <p className="truncate font-medium">{row.billTo}</p>
          {row.agent && (
            <p className="truncate text-xs text-muted-foreground">
              via {row.agent}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "issueDate",
      header: "Issued",
      hideOnMobile: true,
      cell: (row) => formatDate(row.issueDate),
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
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${invoiceStatusClass(row.status)}`}
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

            {row.status !== "paid" && row.status !== "cancelled" && (
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
        searchPlaceholder="Search invoice no, candidate, agent..."
        onRefresh={() => {
          setRefreshing(true);
          void loadData();
        }}
        refreshing={refreshing}
        onCreate={handleCreate}
        createLabel="New Invoice"
      >
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as InvoiceStatus | "all")}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {INVOICE_STATUS_OPTIONS.map((option) => (
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
        emptyTitle="No invoices found"
        emptyDescription="Create an invoice to bill a candidate or agent."
        pageSize={10}
      />

      <FinanceInvoiceForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingInvoice(null);
        }}
        invoice={editingInvoice}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
