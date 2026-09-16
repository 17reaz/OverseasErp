export type FinancePartyType =
  | "agent"
  | "vendor"
  | "customer";

export interface FinanceParty {
  id: string;
  tenantId: string;
  partyType: FinancePartyType;
  partyId: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartyInput {
  partyType: FinancePartyType;
  partyId: string;
  name: string;
  phone?: string | null;
  isActive?: boolean;
}

export interface UpdatePartyInput {
  name?: string;
  phone?: string | null;
  isActive?: boolean;
}