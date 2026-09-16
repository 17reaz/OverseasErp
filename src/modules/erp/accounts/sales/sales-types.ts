export type SaleStatus =
  | "draft"
  | "confirmed"
  | "paid"
  | "cancelled";

export interface Sale {
  id: string;
  tenantId: string;
  partyId: string | null;

  customerName: string;
  service: string;
  description: string | null;

  amount: number;
  costAmount: number;
  grossProfit: number;

  paidAmount: number;
  dueAmount: number;

  saleDate: string;
  status: SaleStatus;
  notes: string;

  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleInput {
  partyId?: string | null;

  customerName: string;
  service: string;
  description?: string;

  amount: number;
  costAmount: number;
  paidAmount?: number;

  saleDate: string;
  status: SaleStatus;
  notes: string;
}

export interface UpdateSaleInput {
  partyId?: string | null;

  customerName?: string;
  service?: string;
  description?: string | null;

  amount?: number;
  costAmount?: number;
  paidAmount?: number;

  saleDate?: string;
  status?: SaleStatus;
  notes?: string | null;
}