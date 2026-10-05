import type {
  FinanceEventModule,
  FinanceEventSourceType,
  FinanceEventType,
} from "@/modules/erp/accounts/events/finance-event-types";

export type FinanceRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "processed"
  | "failed";

export interface FinanceRequest {
  id: string;

  tenantId: string;

  eventType: FinanceEventType;

  module: FinanceEventModule;

  sourceType: FinanceEventSourceType;
  sourceId: string;

  candidateId: string | null;

  partyId: string | null;
  partyType:
    | "candidate"
    | "agent"
    | "vendor"
    | null;

  serviceCode: string | null;
  serviceName: string | null;

  amount: number;
  requestDate: string;

  accountId: string;
  categoryId: string | null;

  transactionType:
    | "income"
    | "expense";

  description: string | null;
  reference: string | null;

  status: FinanceRequestStatus;

  requestedBy: string | null;
  approvedBy: string | null;
  rejectedBy: string | null;

  rejectionReason: string | null;
  processingError: string | null;

  transactionGroupId: string | null;

  approvedAt: string | null;
  rejectedAt: string | null;
  processedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateFinanceRequestInput {
  eventType: FinanceEventType;

  module: FinanceEventModule;

  sourceType: FinanceEventSourceType;
  sourceId: string;

  candidateId?: string | null;

  partyId?: string | null;
  partyType?:
    | "candidate"
    | "agent"
    | "vendor"
    | null;

  serviceCode?: string | null;
  serviceName?: string | null;

  amount: number;

  requestDate?: string;

  accountId: string;
  categoryId?: string | null;

  transactionType:
    | "income"
    | "expense";

  description?: string | null;
  reference?: string | null;

  idempotencyKey: string;
}