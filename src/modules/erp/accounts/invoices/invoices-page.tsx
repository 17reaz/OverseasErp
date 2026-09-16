import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { InvoiceSheet } from "./components/invoice-sheet";
import { InvoicePdfPreview } from "./pdf/invoice-pdf-preview";
import {
  ChevronDown,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { downloadInvoicePdf } from "./pdf/invoice-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  deleteInvoice,
  getInvoiceAgents,
  getInvoices,
  markInvoiceAsPaid,
  updateInvoiceStatus,
} from "./invoice-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  Invoice,
  InvoiceAgent,
  InvoiceStatus,
} from "./invoice-types";

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agents, setAgents] = useState<InvoiceAgent[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    InvoiceStatus | "all"
  >("all");

  const [agentFilter, setAgentFilter] = useState("all");

  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);

  const [editingInvoice, setEditingInvoice] =
    useState<Invoice | null>(null);
    const [previewInvoice, setPreviewInvoice] =
  useState<Invoice | null>(null);

  /*
   * =========================================================
   * LOAD DATA
   * =========================================================
   */

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);

      const [invoiceList, agentList] = await Promise.all([
        getInvoices(),
        getInvoiceAgents(),
      ]);

      setInvoices(invoiceList);
      setAgents(agentList);
    } catch (error) {
      console.error("Failed to load invoices:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to load invoices.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /*
   * =========================================================
   * AGENT MAP
   * =========================================================
   */

  const agentMap = useMemo(() => {
    return new Map(
      agents.map((agent) => [agent.id, agent]),
    );
  }, [agents]);

  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (
        statusFilter !== "all" &&
        invoice.status !== statusFilter
      ) {
        return false;
      }

      if (
        agentFilter !== "all" &&
        invoice.agentId !== agentFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const agentName = invoice.agentId
        ? agentMap.get(invoice.agentId)?.name ?? ""
        : "";

      const searchable = [
        invoice.invoiceNo,
        invoice.customerName,
        agentName,
        invoice.notes ?? "",
        invoice.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [
    invoices,
    search,
    statusFilter,
    agentFilter,
    agentMap,
  ]);

  /*
   * =========================================================
   * SUMMARY
   * =========================================================
   */

  const summary = useMemo(() => {
    const totalAmount = invoices.reduce(
      (sum, invoice) => sum + invoice.totalAmount,
      0,
    );

    const paidAmount = invoices.reduce(
      (sum, invoice) => sum + invoice.paidAmount,
      0,
    );

    const outstandingAmount = invoices.reduce(
      (sum, invoice) =>
        sum +
        Math.max(
          invoice.totalAmount - invoice.paidAmount,
          0,
        ),
      0,
    );

    return {
      total: invoices.length,

      draft: invoices.filter(
        (invoice) => invoice.status === "draft",
      ).length,

      sent: invoices.filter(
        (invoice) => invoice.status === "sent",
      ).length,

      paid: invoices.filter(
        (invoice) => invoice.status === "paid",
      ).length,

      overdue: invoices.filter(
        (invoice) => invoice.status === "overdue",
      ).length,

      cancelled: invoices.filter(
        (invoice) => invoice.status === "cancelled",
      ).length,

      totalAmount,
      paidAmount,
      outstandingAmount,
    };
  }, [invoices]);

  /*
   * =========================================================
   * CREATE
   * =========================================================
   */

  function handleCreate() {
    setEditingInvoice(null);
    setSheetOpen(true);
  }

  /*
   * =========================================================
   * EDIT
   * =========================================================
   */

  function handleEdit(invoice: Invoice) {
    setDetailsOpen(false);
    setSelectedInvoice(null);

    setEditingInvoice(invoice);
    setSheetOpen(true);
  }

  /*
   * =========================================================
   * VIEW
   * =========================================================
   */

  function handleView(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setDetailsOpen(true);
  }

  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

  async function handleDelete(invoice: Invoice) {
    const confirmed = window.confirm(
      `Delete invoice "${invoice.invoiceNo}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteInvoice(invoice.id);

      setInvoices((current) =>
        current.filter(
          (item) => item.id !== invoice.id,
        ),
      );

      setDetailsOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error(
        "Failed to delete invoice:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to delete invoice.",
      );
    }
  }

  /*
   * =========================================================
   * MARK AS PAID
   * =========================================================
   */

  async function handleMarkAsPaid(invoice: Invoice) {
    try {
      const updated = await markInvoiceAsPaid(
        invoice.id,
      );

      setInvoices((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      if (
        selectedInvoice?.id === updated.id
      ) {
        setSelectedInvoice(updated);
      }
    } catch (error) {
      console.error(
        "Failed to mark invoice as paid:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to mark invoice as paid.",
      );
    }
  }

  /*
   * =========================================================
   * STATUS CHANGE
   * =========================================================
   */

  async function handleStatusChange(
    invoice: Invoice,
    status: InvoiceStatus,
  ) {
    try {
      const updated =
        await updateInvoiceStatus(
          invoice.id,
          status,
        );

      setInvoices((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      if (
        selectedInvoice?.id === updated.id
      ) {
        setSelectedInvoice(updated);
      }
    } catch (error) {
      console.error(
        "Failed to update invoice status:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to update invoice status.",
      );
    }
  }

  /*
   * =========================================================
   * SAVE SUCCESS
   * =========================================================
   *
   * This is ready for the InvoiceSheet that we will add
   * in the next step.
   */

  function handleSuccess(saved: Invoice) {
    setInvoices((current) => {
      const exists = current.some(
        (item) => item.id === saved.id,
      );

      if (exists) {
        return current.map((item) =>
          item.id === saved.id
            ? saved
            : item,
        );
      }

      return [saved, ...current];
    });
  }

  /*
   * =========================================================
   * RESET FILTERS
   * =========================================================
   */

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setAgentFilter("all");
  }

  /*
   * =========================================================
   * FORMAT
   * =========================================================
   */

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(
    date: string | null,
  ) {
    if (!date) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  }

  /*
   * =========================================================
   * STATUS BADGE
   * =========================================================
   */

  function renderStatus(
    status: InvoiceStatus,
  ) {
    switch (status) {
      case "draft":
        return (
          <Badge variant="secondary">
            Draft
          </Badge>
        );

      case "sent":
        return (
          <Badge variant="outline">
            Sent
          </Badge>
        );

      case "paid":
        return (
          <Badge>
            Paid
          </Badge>
        );

      case "overdue":
        return (
          <Badge variant="destructive">
            Overdue
          </Badge>
        );

      case "cancelled":
        return (
          <Badge variant="secondary">
            Cancelled
          </Badge>
        );

      default:
        return null;
    }
  }

  /*
   * =========================================================
   * EMPTY STATE
   * =========================================================
   */

  function renderEmptyState() {
    if (loading) {
      return (
        <TableRow>
          <TableCell
            colSpan={8}
            className="h-32 text-center"
          >
            Loading invoices...
          </TableCell>
        </TableRow>
      );
    }

    if (filteredInvoices.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={8}
            className="h-40 text-center"
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <FileText className="h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                No invoices found
              </p>

              <p className="text-sm text-muted-foreground">
                {invoices.length === 0
                  ? "Create your first invoice to get started."
                  : "Try changing your search or filters."}
              </p>

              {invoices.length === 0 && (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={handleCreate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return null;
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="space-y-5">
      {/* =====================================================
       * HEADER
       * ===================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Invoices
          </h1>

          <p className="text-sm text-muted-foreground">
            Create, manage and track your invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => void loadData()}
            disabled={refreshing}
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
          </Button>

          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* =====================================================
       * SUMMARY CARDS
       * ===================================================== */}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {summary.total}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {formatAmount(
                summary.totalAmount,
              )}{" "}
              total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {summary.draft}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Not issued yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {summary.paid}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {formatAmount(
                summary.paidAmount,
              )}{" "}
              collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {formatAmount(
                summary.outstandingAmount,
              )}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {summary.overdue} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* =====================================================
       * TOOLBAR
       * ===================================================== */}

      <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search invoice, customer or agent..."
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(
              value as InvoiceStatus | "all",
            )
          }
        >
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All status
            </SelectItem>

            <SelectItem value="draft">
              Draft
            </SelectItem>

            <SelectItem value="sent">
              Sent
            </SelectItem>

            <SelectItem value="paid">
              Paid
            </SelectItem>

            <SelectItem value="overdue">
              Overdue
            </SelectItem>

            <SelectItem value="cancelled">
              Cancelled
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={agentFilter}
          onValueChange={setAgentFilter}
        >
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All agents
            </SelectItem>

            {agents.map((agent) => (
              <SelectItem
                key={agent.id}
                value={agent.id}
              >
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(search ||
          statusFilter !== "all" ||
          agentFilter !== "all") && (
          <Button
            variant="ghost"
            onClick={resetFilters}
          >
            Clear
          </Button>
        )}
      </div>

      {/* =====================================================
       * FILTER INFO
       * ===================================================== */}

      {(search ||
        statusFilter !== "all" ||
        agentFilter !== "all") && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filteredInvoices.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {invoices.length}
            </span>{" "}
            invoices
          </p>

          <button
            type="button"
            className="text-sm font-medium hover:underline"
            onClick={resetFilters}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* =====================================================
       * TABLE
       * ===================================================== */}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Invoice
                  </TableHead>

                  <TableHead>
                    Customer
                  </TableHead>

                  <TableHead>
                    Agent
                  </TableHead>

                  <TableHead>
                    Issue Date
                  </TableHead>

                  <TableHead>
                    Due Date
                  </TableHead>

                  <TableHead className="text-right">
                    Amount
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {renderEmptyState()}

                {!loading &&
                  filteredInvoices.map(
                    (invoice) => {
                      const agent =
                        invoice.agentId
                          ? agentMap.get(
                              invoice.agentId,
                            )
                          : null;

                      const outstanding =
                        Math.max(
                          invoice.totalAmount -
                            invoice.paidAmount,
                          0,
                        );

                      return (
                        <TableRow
                          key={invoice.id}
                        >
                          <TableCell>
                            <button
                              type="button"
                              className="flex items-center gap-2 font-medium hover:underline"
                              onClick={() =>
                                handleView(
                                  invoice,
                                )
                              }
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />

                              {
                                invoice.invoiceNo
                              }
                            </button>
                          </TableCell>

                          <TableCell>
                            <div className="max-w-[220px] truncate">
                              {
                                invoice.customerName
                              }
                            </div>
                          </TableCell>

                          <TableCell>
                            {agent?.name ??
                              "—"}
                          </TableCell>

                          <TableCell>
                            {formatDate(
                              invoice.issueDate,
                            )}
                          </TableCell>

                          <TableCell>
                            {formatDate(
                              invoice.dueDate,
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="font-medium">
                              {formatAmount(
                                invoice.totalAmount,
                              )}
                            </div>

                            {outstanding >
                              0 &&
                              invoice.status !==
                                "cancelled" && (
                                <div className="text-xs text-muted-foreground">
                                  Due{" "}
                                  {formatAmount(
                                    outstanding,
                                  )}
                                </div>
                              )}
                          </TableCell>

                          <TableCell>
                            {renderStatus(
                              invoice.status,
                            )}
                          </TableCell>

                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleView(
                                      invoice,
                                    )
                                  }
                                >
                                  <Button
  variant="outline"
  size="sm"
  onClick={() => {
    setPreviewInvoice(invoice);
  }}
>
  Preview PDF
</Button>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEdit(
                                      invoice,
                                    )
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {invoice.status !==
                                  "paid" &&
                                  invoice.status !==
                                    "cancelled" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        void handleMarkAsPaid(
                                          invoice,
                                        )
                                      }
                                    >
                                      Mark as paid
                                    </DropdownMenuItem>
                                  )}

                                {invoice.status ===
                                  "draft" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void handleStatusChange(
                                        invoice,
                                        "sent",
                                      )
                                    }
                                  >
                                    Mark as sent
                                  </DropdownMenuItem>
                                )}

                                {invoice.status ===
                                  "sent" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void handleStatusChange(
                                        invoice,
                                        "overdue",
                                      )
                                    }
                                  >
                                    Mark as overdue
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={async () => {
  try {
    const agent = agents.find(
      (item) => item.id === invoice.agentId,
    );

    await downloadInvoicePdf(invoice, agent);
  } catch (error) {
    console.error("Failed to download invoice PDF:", error);
  }
}}
                                >
                                  <Button
  variant="ghost"
  size="sm"
  onClick={async () => {
    try {
      const agent = agents.find(
        (item) => item.id === invoice.agentId,
      );

      await downloadInvoicePdf(invoice, agent);
    } catch (error) {
      console.error(
        "Failed to download invoice PDF:",
        error,
      );
    }
  }}
>
  Download PDF
</Button>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    void handleDelete(
                                      invoice,
                                    )
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
       * DETAILS
       *
       * Temporarily kept inline until InvoiceDetailsSheet
       * is added.
       * ===================================================== */}

      {detailsOpen &&
        selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl border bg-background shadow-xl">
              <div className="flex items-start justify-between border-b p-5">
                <div>
                  <h2 className="font-semibold">
                    {
                      selectedInvoice.invoiceNo
                    }
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Invoice details
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDetailsOpen(false);
                    setSelectedInvoice(null);
                  }}
                >
                  <ChevronDown className="h-4 w-4 rotate-45" />
                </Button>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Customer
                  </p>

                  <p className="font-medium">
                    {
                      selectedInvoice.customerName
                    }
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Issue date
                    </p>

                    <p className="font-medium">
                      {formatDate(
                        selectedInvoice.issueDate,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Due date
                    </p>

                    <p className="font-medium">
                      {formatDate(
                        selectedInvoice.dueDate,
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex justify-between text-sm">
                    <span>
                      Subtotal
                    </span>

                    <span>
                      {formatAmount(
                        selectedInvoice.subtotal,
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span>
                      Discount
                    </span>

                    <span>
                      -
                      {formatAmount(
                        selectedInvoice.discount,
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span>
                      Tax
                    </span>

                    <span>
                      {formatAmount(
                        selectedInvoice.tax,
                      )}
                    </span>
                  </div>

                  <div className="my-3 border-t" />

                  <div className="flex justify-between font-semibold">
                    <span>
                      Total
                    </span>

                    <span>
                      {formatAmount(
                        selectedInvoice.totalAmount,
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>
                      Paid
                    </span>

                    <span>
                      {formatAmount(
                        selectedInvoice.paidAmount,
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Status
                  </span>

                  {renderStatus(
                    selectedInvoice.status,
                  )}
                </div>

                {selectedInvoice.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Notes
                    </p>

                    <p className="mt-1 text-sm">
                      {
                        selectedInvoice.notes
                      }
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t p-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleEdit(
                      selectedInvoice,
                    )
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>

                {selectedInvoice.status !==
                  "paid" &&
                  selectedInvoice.status !==
                    "cancelled" && (
                    <Button
                      onClick={() =>
                        void handleMarkAsPaid(
                          selectedInvoice,
                        )
                      }
                    >
                      Mark as Paid
                    </Button>
                  )}
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
       * INVOICE SHEET
       *
       * Uncomment this section after InvoiceSheet is created.
       * ===================================================== */}

      
      <InvoiceSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);

          if (!open) {
            setEditingInvoice(null);
          }
        }}
        invoice={editingInvoice}
        agents={agents}
        onSuccess={handleSuccess}
      />
     <Dialog
  open={Boolean(previewInvoice)}
  onOpenChange={(open) => {
    if (!open) {
      setPreviewInvoice(null);
    }
  }}
>
  <DialogContent className="h-[90vh] max-w-5xl">
    <DialogHeader>
      <DialogTitle>
        Invoice Preview
        {previewInvoice
          ? ` — ${previewInvoice.invoiceNo}`
          : ""}
      </DialogTitle>
    </DialogHeader>

    {previewInvoice && (
      <div className="min-h-0 flex-1">
        <InvoicePdfPreview
          invoice={previewInvoice}
          agent={
            agents.find(
              (agent) =>
                agent.id === previewInvoice.agentId,
            ) ?? null
          }
        />
      </div>
    )}
  </DialogContent>
</Dialog>
    </div>
  );
}