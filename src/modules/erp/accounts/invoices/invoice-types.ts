export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNo: string;

  customerName: string;
  agentId: string | null;

  issueDate: string;
  dueDate: string | null;

  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;

  status: InvoiceStatus;
  notes: string | null;

  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceInput {
  invoiceNo?: string;

  customerName: string;
  agentId?: string | null;

  issueDate?: string;
  dueDate?: string | null;

  subtotal?: number;
  discount?: number;
  tax?: number;
  totalAmount?: number;
  paidAmount?: number;

  status?: InvoiceStatus;
  notes?: string | null;
}

export interface UpdateInvoiceInput {
  invoiceNo?: string;

  customerName?: string;
  agentId?: string | null;

  issueDate?: string;
  dueDate?: string | null;

  subtotal?: number;
  discount?: number;
  tax?: number;
  totalAmount?: number;
  paidAmount?: number;

  status?: InvoiceStatus;
  notes?: string | null;
}

export interface InvoiceAgent {
  id: string;
  name: string;
  code?: string | null;
}