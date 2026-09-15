import { supabase } from "@/lib/supabase/client";

export type PayrollStatus =
  | "pending"
  | "paid"
  | "cancelled";

export interface PayrollRecord {
  id: string;
  tenantId: string;

  employeeName: string;
  employeeCode: string | null;
  designation: string | null;

  payrollMonth: string;

  basicSalary: number;
  bonus: number;
  allowances: number;
  deductions: number;
  netSalary: number;

  status: PayrollStatus;

  paymentDate: string | null;
  paymentMethod: string | null;

  accountId: string | null;
  transactionId: string | null;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreatePayrollInput {
  employeeName: string;
  employeeCode: string | null;
  designation: string | null;
  payrollMonth: string;

  basicSalary: number;
  bonus: number;
  allowances: number;
  deductions: number;

  paymentMethod: string | null;
  accountId: string | null;

  notes: string | null;
}

export type UpdatePayrollInput = CreatePayrollInput;

interface PayrollRow {
  id: string;
  tenant_id: string;

  employee_name: string;
  employee_code: string | null;
  designation: string | null;

  payroll_month: string;

  basic_salary: number | string;
  bonus: number | string;
  allowances: number | string;
  deductions: number | string;
  net_salary: number | string;

  status: string;

  payment_date: string | null;
  payment_method: string | null;

  account_id: string | null;
  transaction_id: string | null;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

const PAYROLL_SELECT = `
  id,
  tenant_id,
  employee_name,
  employee_code,
  designation,
  payroll_month,
  basic_salary,
  bonus,
  allowances,
  deductions,
  net_salary,
  status,
  payment_date,
  payment_method,
  account_id,
  transaction_id,
  notes,
  created_at,
  updated_at
`;

export async function getPayrollRecords(): Promise<PayrollRecord[]> {
  const { data, error } = await supabase
    .schema("finance")
    .from("payroll")
    .select(PAYROLL_SELECT)
    .order("payroll_month", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as PayrollRow[] | null) ?? []).map(
    normalizePayroll,
  );
}

export async function getPayrollRecord(
  id: string,
): Promise<PayrollRecord> {
  const { data, error } = await supabase
    .schema("finance")
    .from("payroll")
    .select(PAYROLL_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePayroll(data as PayrollRow);
}

export async function createPayroll(
  input: CreatePayrollInput,
): Promise<PayrollRecord> {
  const { data, error } = await supabase
    .schema("finance")
    .from("payroll")
    .insert({
      employee_name: input.employeeName,
      employee_code: input.employeeCode,
      designation: input.designation,
      payroll_month: input.payrollMonth,

      basic_salary: input.basicSalary,
      bonus: input.bonus,
      allowances: input.allowances,
      deductions: input.deductions,

      status: "pending",

      payment_method: input.paymentMethod,
      account_id: input.accountId,

      notes: input.notes,
    })
    .select(PAYROLL_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePayroll(data as PayrollRow);
}

export async function updatePayroll(
  id: string,
  input: UpdatePayrollInput,
): Promise<PayrollRecord> {
  const { data, error } = await supabase
    .schema("finance")
    .from("payroll")
    .update({
      employee_name: input.employeeName,
      employee_code: input.employeeCode,
      designation: input.designation,
      payroll_month: input.payrollMonth,

      basic_salary: input.basicSalary,
      bonus: input.bonus,
      allowances: input.allowances,
      deductions: input.deductions,

      payment_method: input.paymentMethod,
      account_id: input.accountId,

      notes: input.notes,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select(PAYROLL_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePayroll(data as PayrollRow);
}

export async function cancelPayroll(
  id: string,
): Promise<PayrollRecord> {
  const { data, error } = await supabase
    .schema("finance")
    .from("payroll")
    .update({
      status: "cancelled",
    })
    .eq("id", id)
    .eq("status", "pending")
    .select(PAYROLL_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePayroll(data as PayrollRow);
}

export async function markPayrollPaid(
  id: string,
  input: {
    paymentDate: string;
    paymentMethod: string;
    accountId: string;
  },
): Promise<PayrollRecord> {
  const { data, error } = await supabase
    .schema("finance")
    .from("payroll")
    .update({
      status: "paid",
      payment_date: input.paymentDate,
      payment_method: input.paymentMethod,
      account_id: input.accountId,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select(PAYROLL_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePayroll(data as PayrollRow);
}

function normalizePayroll(row: PayrollRow): PayrollRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,

    employeeName: row.employee_name,
    employeeCode: row.employee_code,
    designation: row.designation,

    payrollMonth: row.payroll_month,

    basicSalary: Number(row.basic_salary),
    bonus: Number(row.bonus),
    allowances: Number(row.allowances),
    deductions: Number(row.deductions),
    netSalary: Number(row.net_salary),

    status: row.status as PayrollStatus,

    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,

    accountId: row.account_id,
    transactionId: row.transaction_id,

    notes: row.notes,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
