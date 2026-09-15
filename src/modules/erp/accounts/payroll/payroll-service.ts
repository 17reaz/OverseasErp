// src/modules/erp/finance/payroll/payroll-service.ts

import { supabase } from "@/lib/supabase/client";

export type PayrollStatus =
  | "pending"
  | "paid"
  | "cancelled";

export interface PayrollRecord {
  id: string;
  tenantId: string;
  employeeName: string;
  employeeId: string | null;
  salaryMonth: string;
  basicSalary: number;
  allowance: number;
  deduction: number;
  netSalary: number;
  status: PayrollStatus;
  paymentDate: string | null;
  transactionId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PayrollRow {
  id: string;
  tenant_id: string;
  employee_name: string;
  employee_id: string | null;
  salary_month: string;
  basic_salary: number | string;
  allowance: number | string;
  deduction: number | string;
  net_salary: number | string;
  status: string;
  payment_date: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Load payroll records.
 *
 * NOTE:
 * This expects finance.payroll to exist.
 * No schema migration is performed here.
 */
export async function getPayrollRecords(): Promise<
  PayrollRecord[]
> {
  const { data, error } = await supabase
    .schema("finance")
    .from("payroll")
    .select(
      `
        id,
        tenant_id,
        employee_name,
        employee_id,
        salary_month,
        basic_salary,
        allowance,
        deduction,
        net_salary,
        status,
        payment_date,
        transaction_id,
        notes,
        created_at,
        updated_at
      `,
    )
    .order("salary_month", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data as PayrollRow[] | null) ?? []
  ).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,

    employeeName: row.employee_name,
    employeeId: row.employee_id,

    salaryMonth: row.salary_month,

    basicSalary: Number(row.basic_salary),
    allowance: Number(row.allowance),
    deduction: Number(row.deduction),
    netSalary: Number(row.net_salary),

    status:
      row.status as PayrollStatus,

    paymentDate: row.payment_date,
    transactionId: row.transaction_id,

    notes: row.notes,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getPayrollRecord(
  id: string,
): Promise<PayrollRecord> {
  const { data, error } = await supabase
    .schema("finance")
    .from("payroll")
    .select(
      `
        id,
        tenant_id,
        employee_name,
        employee_id,
        salary_month,
        basic_salary,
        allowance,
        deduction,
        net_salary,
        status,
        payment_date,
        transaction_id,
        notes,
        created_at,
        updated_at
      `,
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as PayrollRow;

  return {
    id: row.id,
    tenantId: row.tenant_id,

    employeeName: row.employee_name,
    employeeId: row.employee_id,

    salaryMonth: row.salary_month,

    basicSalary: Number(row.basic_salary),
    allowance: Number(row.allowance),
    deduction: Number(row.deduction),
    netSalary: Number(row.net_salary),

    status:
      row.status as PayrollStatus,

    paymentDate: row.payment_date,
    transactionId: row.transaction_id,

    notes: row.notes,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}