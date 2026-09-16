export type SaleStatus =
  | "draft"
  | "confirmed"
  | "paid"
  | "cancelled";

export interface Sale {
  id: string;
  customerName: string;
  service: string;
  amount: number;
  saleDate: string;
  status: SaleStatus;
  notes: string;
}

export interface CreateSaleInput {
  customerName: string;
  service: string;
  amount: number;
  saleDate: string;
  status: SaleStatus;
  notes: string;
}