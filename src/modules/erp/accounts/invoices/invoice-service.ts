import { supabase } from "@/lib/supabase/client";

import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceAgent,
  InvoiceStatus,
  UpdateInvoiceInput,
} from "./invoice-types";

/* =========================================================
 * HELPERS
 * ========================================================= */

async function getCurrentUserContext() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.tenant_id) {
    throw new Error("Your account is not linked to a tenant.");
  }

  return {
    userId: user.id,
    tenantId: profile.tenant_id as string,
  };
}

/* =========================================================
 * MAP DATABASE ROW
 * ========================================================= */

function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    invoiceNo: row.invoice_no,

    customerName: row.customer_name,
    agentId: row.agent_id,

    issueDate: row.issue_date,
    dueDate: row.due_date,

    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount ?? 0),
    tax: Number(row.tax ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    paidAmount: Number(row.paid_amount ?? 0),

    status: row.status as InvoiceStatus,
    notes: row.notes,

    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* =========================================================
 * GET INVOICES
 * ========================================================= */

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .schema("finance")
    .from("invoices")
    .select(`
      id,
      tenant_id,
      invoice_no,
      customer_name,
      agent_id,
      issue_date,
      due_date,
      subtotal,
      discount,
      tax,
      total_amount,
      paid_amount,
      status,
      notes,
      created_by,
      created_at,
      updated_at
    `)
    .order("issue_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapInvoice);
}

/* =========================================================
 * GET SINGLE INVOICE
 * ========================================================= */

export async function getInvoice(
  invoiceId: string,
): Promise<Invoice> {
  const { data, error } = await supabase
    .schema("finance")
    .from("invoices")
    .select(`
      id,
      tenant_id,
      invoice_no,
      customer_name,
      agent_id,
      issue_date,
      due_date,
      subtotal,
      discount,
      tax,
      total_amount,
      paid_amount,
      status,
      notes,
      created_by,
      created_at,
      updated_at
    `)
    .eq("id", invoiceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapInvoice(data);
}

/* =========================================================
 * GET AGENTS
 * ========================================================= */

export async function getInvoiceAgents(): Promise<InvoiceAgent[]> {
  const { data, error } = await supabase
    .from("agents")
    .select(`
      id,
      name,
      code
    `)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
  }));
}

/* =========================================================
 * CREATE INVOICE
 * ========================================================= */

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<Invoice> {
  const { userId, tenantId } =
    await getCurrentUserContext();

  const subtotal = Number(input.subtotal ?? 0);
  const discount = Number(input.discount ?? 0);
  const tax = Number(input.tax ?? 0);

  const totalAmount =
    input.totalAmount ??
    Math.max(subtotal - discount + tax, 0);

  const paidAmount = Number(input.paidAmount ?? 0);

  const { data, error } = await supabase
    .schema("finance")
    .from("invoices")
    .insert({
      tenant_id: tenantId,

      invoice_no:
        input.invoiceNo?.trim() ||
        `INV-${Date.now()}`,

      customer_name:
        input.customerName.trim(),

      agent_id:
        input.agentId || null,

      issue_date:
        input.issueDate ||
        new Date().toISOString().slice(0, 10),

      due_date:
        input.dueDate || null,

      subtotal,
      discount,
      tax,
      total_amount: totalAmount,
      paid_amount: paidAmount,

      status:
        input.status || "draft",

      notes:
        input.notes?.trim() || null,

      created_by: userId,
    })
    .select(`
      id,
      tenant_id,
      invoice_no,
      customer_name,
      agent_id,
      issue_date,
      due_date,
      subtotal,
      discount,
      tax,
      total_amount,
      paid_amount,
      status,
      notes,
      created_by,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapInvoice(data);
}

/* =========================================================
 * UPDATE INVOICE
 * ========================================================= */

export async function updateInvoice(
  invoiceId: string,
  input: UpdateInvoiceInput,
): Promise<Invoice> {
  const updateData: Record<string, unknown> = {};

  if (input.invoiceNo !== undefined) {
    updateData.invoice_no =
      input.invoiceNo.trim();
  }

  if (input.customerName !== undefined) {
    updateData.customer_name =
      input.customerName.trim();
  }

  if (input.agentId !== undefined) {
    updateData.agent_id =
      input.agentId || null;
  }

  if (input.issueDate !== undefined) {
    updateData.issue_date =
      input.issueDate;
  }

  if (input.dueDate !== undefined) {
    updateData.due_date =
      input.dueDate || null;
  }

  if (input.subtotal !== undefined) {
    updateData.subtotal =
      Number(input.subtotal);
  }

  if (input.discount !== undefined) {
    updateData.discount =
      Number(input.discount);
  }

  if (input.tax !== undefined) {
    updateData.tax =
      Number(input.tax);
  }

  if (input.totalAmount !== undefined) {
    updateData.total_amount =
      Number(input.totalAmount);
  }

  if (input.paidAmount !== undefined) {
    updateData.paid_amount =
      Number(input.paidAmount);
  }

  if (input.status !== undefined) {
    updateData.status =
      input.status;
  }

  if (input.notes !== undefined) {
    updateData.notes =
      input.notes?.trim() || null;
  }

  const { data, error } = await supabase
    .schema("finance")
    .from("invoices")
    .update(updateData)
    .eq("id", invoiceId)
    .select(`
      id,
      tenant_id,
      invoice_no,
      customer_name,
      agent_id,
      issue_date,
      due_date,
      subtotal,
      discount,
      tax,
      total_amount,
      paid_amount,
      status,
      notes,
      created_by,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapInvoice(data);
}

/* =========================================================
 * DELETE INVOICE
 * ========================================================= */

export async function deleteInvoice(
  invoiceId: string,
): Promise<void> {
  const { error } = await supabase
    .schema("finance")
    .from("invoices")
    .delete()
    .eq("id", invoiceId);

  if (error) {
    throw new Error(error.message);
  }
}

/* =========================================================
 * UPDATE STATUS
 * ========================================================= */

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
): Promise<Invoice> {
  return updateInvoice(invoiceId, {
    status,
  });
}

/* =========================================================
 * MARK AS PAID
 * ========================================================= */

export async function markInvoiceAsPaid(
  invoiceId: string,
): Promise<Invoice> {
  const invoice = await getInvoice(invoiceId);

  return updateInvoice(invoiceId, {
    paidAmount: invoice.totalAmount,
    status: "paid",
  });
}