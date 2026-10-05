import type {
  CreateTransactionGroupInput,
  TransactionType,
} from "@/modules/erp/accounts/transactions/transaction-types";

import {
  FinanceEventMappingError,
} from "./finance-event-errors";

import {
  getFinanceEventRule,
} from "./finance-event-registry";

import type {
  FinanceEventInput,
  FinanceEventPlan,
} from "./finance-event-types";

/**
 * Events that financially reverse the normal transaction
 * direction.
 *
 * Example:
 *
 * service.completed
 *     expense 1000
 *
 * service.cancelled
 *     income 1000
 *
 * This allows cancellation/reversal to preserve the
 * original financial history instead of deleting it.
 */
const REVERSAL_EVENTS = new Set([
  "service.cancelled",
  "service.reversed",
  "refund.received",
  "advance.refunded",
] as const);

function getTransactionType(
  event: FinanceEventInput,
): TransactionType {
  const baseType =
    event.finance.transactionType;

  if (REVERSAL_EVENTS.has(
    event.event as
      | "service.cancelled"
      | "service.reversed"
      | "refund.received"
      | "advance.refunded",
  )) {
    return baseType === "income"
      ? "expense"
      : "income";
  }

  return baseType;
}

/**
 * Build a stable finance reference.
 *
 * The reference is important because it allows the financial
 * transaction to be traced back to the ERP business event.
 */
function buildReference(
  event: FinanceEventInput,
): string {
  const baseReference =
    event.reference?.trim() ||
    `${event.source.type.toUpperCase()}-${event.source.id}`;

  if (
    REVERSAL_EVENTS.has(
      event.event as
        | "service.cancelled"
        | "service.reversed"
        | "refund.received"
        | "advance.refunded",
    )
  ) {
    return `REVERSAL-${baseReference}`;
  }

  return baseReference;
}

/**
 * Build a human-readable transaction description.
 */
function buildDescription(
  event: FinanceEventInput,
): string {
  if (event.description?.trim()) {
    return event.description.trim();
  }

  const serviceName =
    event.service?.name ||
    event.source.type;

  switch (event.event) {
    case "service.completed":
      return `${serviceName} completed`;

    case "service.cancelled":
      return `${serviceName} cancelled`;

    case "service.reversed":
      return `${serviceName} reversed`;

    case "payment.received":
      return "Payment received";

    case "payment.made":
      return "Payment made";

    case "refund.issued":
      return "Refund issued";

    case "refund.received":
      return "Refund received";

    case "advance.received":
      return "Advance received";

    case "advance.consumed":
      return "Advance consumed";

    case "advance.refunded":
      return "Advance refunded";

    default:
      return "Finance event";
  }
}

/**
 * Resolve the effective event date.
 */
function getEventDate(
  event: FinanceEventInput,
): string {
  if (event.date?.trim()) {
    return event.date;
  }

  return new Date().toISOString();
}

/**
 * Validate mapper-specific requirements.
 *
 * General validation is handled by finance-event-validator.ts.
 *
 * This validation only protects the mapping boundary.
 */
function validateMappingRequirements(
  event: FinanceEventInput,
): void {
  if (!event.finance) {
    throw new FinanceEventMappingError(
      "Finance context is required before mapping an event.",
    );
  }

  if (!event.finance.accountId?.trim()) {
    throw new FinanceEventMappingError(
      "A finance account is required for every finance event.",
    );
  }

  if (
    !Number.isFinite(event.amount) ||
    event.amount <= 0
  ) {
    throw new FinanceEventMappingError(
      "Finance event amount must be greater than zero.",
    );
  }

  if (!event.source?.id?.trim()) {
    throw new FinanceEventMappingError(
      "Finance event source id is required.",
    );
  }
}

/**
 * Convert a Finance Event into the existing
 * Transaction Group input structure.
 */
export function mapFinanceEventToTransactionGroup(
  event: FinanceEventInput,
): FinanceEventPlan {
  validateMappingRequirements(event);

  const rule =
    getFinanceEventRule(event);

  const date =
    getEventDate(event);

  const description =
    buildDescription(event);

  const reference =
    buildReference(event);

  const transactionType =
    getTransactionType(event);

  const transactionGroup:
    CreateTransactionGroupInput = {
      groupDate: date,

      description,

      reference,

      status: "completed",

      transactions: [
        {
          type: transactionType,

          amount: event.amount,

          date,

          accountId:
            event.finance.accountId,

          categoryId:
            event.finance.categoryId ??
            null,

          description,

          reference,

          status: "completed",

          partyId:
            event.finance.partyId ??
            null,
        },
      ],
    };

  return {
    event,

    transactionGroup,

    reversalOfReference:
      rule.isReversal
        ? event.reference ??
          `${event.source.type.toUpperCase()}-${event.source.id}`
        : null,
  };
}