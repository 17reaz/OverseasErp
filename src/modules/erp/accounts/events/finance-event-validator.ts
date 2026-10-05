import {
  FinanceEventValidationError,
} from "./finance-event-errors";

import type {
  FinanceEventInput,
  FinanceEventModule,
  FinanceEventSourceType,
  FinanceEventType,
} from "./finance-event-types";

/**
 * Supported ERP modules.
 *
 * Kept here for runtime validation because TypeScript
 * types disappear at runtime.
 */
const FINANCE_EVENT_MODULES: readonly FinanceEventModule[] = [
  "medical",
  "mofa",
  "finger",
  "pcc",
  "takamul",
  "visa",
  "bmet",
  "manpower",
  "flight",
  "iqama",
  "sales",
  "candidate",
  "agent",
  "vendor",
  "system",
];

/**
 * Supported event types.
 */
const FINANCE_EVENT_TYPES: readonly FinanceEventType[] = [
  "service.completed",
  "service.cancelled",
  "service.reversed",
  "payment.received",
  "payment.made",
  "refund.issued",
  "refund.received",
  "advance.received",
  "advance.consumed",
  "advance.refunded",
];

/**
 * Supported ERP source types.
 */
const FINANCE_EVENT_SOURCE_TYPES: readonly FinanceEventSourceType[] = [
  "medical",
  "mofa",
  "finger",
  "pcc",
  "takamul",
  "visa",
  "bmet",
  "manpower",
  "flight",
  "iqama",
  "sale",
  "payment",
  "refund",
  "advance",
];

/**
 * Service-related events require a business service source.
 */
const SERVICE_EVENTS: readonly FinanceEventType[] = [
  "service.completed",
  "service.cancelled",
  "service.reversed",
];

/**
 * Validate that a value is a non-empty string.
 */
function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

/**
 * Validate that a value is a supported runtime enum value.
 */
function isSupportedValue<T extends string>(
  value: string,
  values: readonly T[],
): value is T {
  return values.includes(value as T);
}

/**
 * Validate event-level required fields.
 */
function validateBasicEvent(
  event: FinanceEventInput,
): void {
  if (!isSupportedValue(
    event.event,
    FINANCE_EVENT_TYPES,
  )) {
    throw new FinanceEventValidationError(
      `Unsupported finance event type: ${String(event.event)}`,
    );
  }

  if (!isSupportedValue(
    event.module,
    FINANCE_EVENT_MODULES,
  )) {
    throw new FinanceEventValidationError(
      `Unsupported finance event module: ${String(event.module)}`,
    );
  }

  if (
    !event.source ||
    !isNonEmptyString(event.source.id)
  ) {
    throw new FinanceEventValidationError(
      "Finance event source id is required.",
    );
  }

  if (!isSupportedValue(
    event.source.type,
    FINANCE_EVENT_SOURCE_TYPES,
  )) {
    throw new FinanceEventValidationError(
      `Unsupported finance event source type: ${String(
        event.source.type,
      )}`,
    );
  }
}

/**
 * Validate financial amount.
 */
function validateAmount(
  event: FinanceEventInput,
): void {
  if (
    typeof event.amount !== "number" ||
    !Number.isFinite(event.amount)
  ) {
    throw new FinanceEventValidationError(
      "Finance event amount must be a valid number.",
    );
  }

  if (event.amount <= 0) {
    throw new FinanceEventValidationError(
      "Finance event amount must be greater than zero.",
    );
  }
}

/**
 * Validate finance-specific information.
 */
function validateFinanceContext(
  event: FinanceEventInput,
): void {
  if (!event.finance) {
    throw new FinanceEventValidationError(
      "Finance context is required.",
    );
  }

  if (!isNonEmptyString(
    event.finance.accountId,
  )) {
    throw new FinanceEventValidationError(
      "Finance account id is required.",
    );
  }

  if (
    event.finance.categoryId !== undefined &&
    event.finance.categoryId !== null &&
    !isNonEmptyString(event.finance.categoryId)
  ) {
    throw new FinanceEventValidationError(
      "Finance category id must be a valid value.",
    );
  }

  if (
    event.finance.partyId !== undefined &&
    event.finance.partyId !== null &&
    !isNonEmptyString(event.finance.partyId)
  ) {
    throw new FinanceEventValidationError(
      "Finance party id must be a valid value.",
    );
  }

  if (
    event.finance.transactionType !== "income" &&
    event.finance.transactionType !== "expense"
  ) {
    throw new FinanceEventValidationError(
      "Finance transaction type must be either income or expense.",
    );
  }
}

/**
 * Validate optional candidate reference.
 */
function validateCandidate(
  event: FinanceEventInput,
): void {
  if (
    event.candidateId !== undefined &&
    event.candidateId !== null &&
    !isNonEmptyString(event.candidateId)
  ) {
    throw new FinanceEventValidationError(
      "Candidate id must be a valid value.",
    );
  }
}

/**
 * Validate optional party information.
 */
function validateParty(
  event: FinanceEventInput,
): void {
  if (!event.party) {
    return;
  }

  if (!isNonEmptyString(event.party.id)) {
    throw new FinanceEventValidationError(
      "Finance event party id is required.",
    );
  }

  if (
    event.party.type !== "candidate" &&
    event.party.type !== "agent" &&
    event.party.type !== "vendor"
  ) {
    throw new FinanceEventValidationError(
      `Unsupported finance party type: ${String(
        event.party.type,
      )}`,
    );
  }

  if (
    event.finance.partyId &&
    event.finance.partyId !== event.party.id
  ) {
    throw new FinanceEventValidationError(
      "Event party id does not match finance party id.",
    );
  }
}

/**
 * Validate service-specific requirements.
 */
function validateServiceEvent(
  event: FinanceEventInput,
): void {
  if (!SERVICE_EVENTS.includes(event.event)) {
    return;
  }

  if (
    !event.service ||
    !isNonEmptyString(event.service.code) ||
    !isNonEmptyString(event.service.name)
  ) {
    throw new FinanceEventValidationError(
      "Service information is required for service events.",
    );
  }
}

/**
 * Validate event date when provided.
 */
function validateDate(
  event: FinanceEventInput,
): void {
  if (
    event.date === undefined ||
    event.date === null
  ) {
    return;
  }

  if (!isNonEmptyString(event.date)) {
    throw new FinanceEventValidationError(
      "Finance event date must be a valid ISO date string.",
    );
  }

  const timestamp = Date.parse(event.date);

  if (Number.isNaN(timestamp)) {
    throw new FinanceEventValidationError(
      "Finance event date is invalid.",
    );
  }
}

/**
 * Validate optional text fields.
 */
function validateTextFields(
  event: FinanceEventInput,
): void {
  if (
    event.description !== undefined &&
    event.description !== null &&
    !isNonEmptyString(event.description)
  ) {
    throw new FinanceEventValidationError(
      "Finance event description must be a valid value.",
    );
  }

  if (
    event.reference !== undefined &&
    event.reference !== null &&
    !isNonEmptyString(event.reference)
  ) {
    throw new FinanceEventValidationError(
      "Finance event reference must be a valid value.",
    );
  }
}

/**
 * Validate the complete Finance Event contract.
 *
 * This function does not access Supabase and does not
 * create/update any financial record.
 */
export function validateFinanceEvent(
  event: FinanceEventInput,
): void {
  if (!event) {
    throw new FinanceEventValidationError(
      "Finance event is required.",
    );
  }

  validateBasicEvent(event);
  validateAmount(event);
  validateFinanceContext(event);
  validateCandidate(event);
  validateParty(event);
  validateServiceEvent(event);
  validateDate(event);
  validateTextFields(event);
}