import type {
  CreateTransactionGroupInput,
  TransactionType,
} from "@/modules/erp/accounts/transactions/transaction-types";

/**
 * All financial events that can originate from the ERP.
 *
 * Important:
 * - Business modules create events.
 * - The Finance Event Engine converts events into financial effects.
 * - ERP modules should not create finance transactions directly.
 */
export type FinanceEventType =
  | "service.completed"
  | "service.cancelled"
  | "service.reversed"
  | "payment.received"
  | "payment.made"
  | "refund.issued"
  | "refund.received"
  | "advance.received"
  | "advance.consumed"
  | "advance.refunded";

/**
 * ERP module that produced the financial event.
 */
export type FinanceEventModule =
  | "medical"
  | "mofa"
  | "finger"
  | "pcc"
  | "takamul"
  | "visa"
  | "bmet"
  | "manpower"
  | "flight"
  | "iqama"
  | "sales"
  | "candidate"
  | "agent"
  | "vendor"
  | "system";

/**
 * Business object that caused the finance event.
 */
export type FinanceEventSourceType =
  | "medical"
  | "mofa"
  | "finger"
  | "pcc"
  | "takamul"
  | "visa"
  | "bmet"
  | "manpower"
  | "flight"
  | "iqama"
  | "sale"
  | "payment"
  | "refund"
  | "advance";

/**
 * Lifecycle state of a finance event.
 *
 * This is the event-engine state, not the transaction status.
 */
export type FinanceEventStatus =
  | "pending"
  | "processed"
  | "failed"
  | "reversed";

/**
 * Reference to the ERP record that generated the event.
 */
export interface FinanceEventSource {
  type: FinanceEventSourceType;
  id: string;
}

/**
 * Optional business party connected to the event.
 *
 * Candidate = customer
 * Agent/Vendor = supplier/payable party
 */
export interface FinanceEventParty {
  type: "candidate" | "agent" | "vendor";
  id: string;
}

/**
 * Service information attached to a service-related event.
 */
export interface FinanceEventServiceInfo {
  code: string;
  name: string;
}

/**
 * Finance-specific information required to create
 * the financial consequence of an event.
 */
export interface FinanceEventFinanceContext {
  /**
   * Finance account where the transaction is recorded.
   *
   * Example:
   * - Cash
   * - Bank
   * - Mobile Banking
   */
  accountId: string;

  /**
   * Finance category for the transaction.
   *
   * Example:
   * - Medical Cost
   * - Visa Cost
   * - Service Revenue
   */
  categoryId?: string | null;

  /**
   * Finance party reference.
   *
   * This should point to the corresponding finance party
   * when the event affects a candidate, agent, or vendor.
   */
  partyId?: string | null;

  /**
   * Base financial direction.
   *
   * The event mapper may reverse this direction for
   * cancellation/reversal/refund events.
   */
  transactionType: TransactionType;
}

/**
 * Main event contract used by ERP modules.
 *
 * This is the most important type in the Finance Event Engine.
 *
 * Example:
 *
 * recordFinanceEvent({
 *   event: "service.completed",
 *   module: "medical",
 *   source: {
 *     type: "medical",
 *     id: medicalId,
 *   },
 *   candidateId,
 *   amount: 5000,
 *   finance: {
 *     accountId,
 *     categoryId,
 *     partyId,
 *     transactionType: "expense",
 *   },
 * });
 */
export interface FinanceEventInput {
  /**
   * What financial business action happened.
   */
  event: FinanceEventType;

  /**
   * Which ERP module produced the event.
   */
  module: FinanceEventModule;

  /**
   * Original ERP business record.
   */
  source: FinanceEventSource;

  /**
   * Candidate affected by the business event.
   */
  candidateId?: string | null;

  /**
   * Optional party involved in the event.
   */
  party?: FinanceEventParty | null;

  /**
   * Optional service information.
   */
  service?: FinanceEventServiceInfo | null;

  /**
   * Financial amount affected by the event.
   *
   * Must be greater than zero.
   */
  amount: number;

  /**
   * Business/financial date.
   *
   * ISO date/time string.
   * If omitted, the engine will use the current time.
   */
  date?: string;

  /**
   * Human-readable description.
   */
  description?: string | null;

  /**
   * External/business reference.
   *
   * If omitted, the engine can derive one from
   * source.type + source.id.
   */
  reference?: string | null;

  /**
   * Finance-specific information required
   * to produce the transaction.
   */
  finance: FinanceEventFinanceContext;
}

/**
 * Result of mapping an ERP finance event into
 * the existing Finance transaction system.
 */
export interface FinanceEventPlan {
  /**
   * Original event received from ERP.
   */
  event: FinanceEventInput;

  /**
   * Transaction group that will be sent to the
   * existing transaction-group service.
   */
  transactionGroup: CreateTransactionGroupInput;

  /**
   * Original reference when this event represents
   * a reversal/cancellation.
   */
  reversalOfReference?: string | null;
}

/**
 * Result returned after the Finance Event Engine
 * successfully processes an event.
 */
export interface FinanceEventResult {
  /**
   * Original event that was processed.
   */
  event: FinanceEventInput;

  /**
   * Finance transaction group created by the engine.
   */
  transactionGroupId: string;

  /**
   * Number of transactions created inside the group.
   */
  transactionCount: number;

  /**
   * Final engine status.
   */
  status: "processed";
}