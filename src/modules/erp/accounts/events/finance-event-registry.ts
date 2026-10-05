import {
  FinanceEventRegistryError,
} from "./finance-event-errors";

import type {
  FinanceEventInput,
  FinanceEventModule,
  FinanceEventType,
} from "./finance-event-types";

/**
 * Financial effect describes how an ERP event should
 * behave from the Finance perspective.
 *
 * Important:
 *
 * - This is NOT a transaction.
 * - This is NOT a database record.
 * - This is only the rule used by the Finance Event Engine.
 */
export interface FinanceEventRule {
  /**
   * ERP module that owns the business event.
   */
  module: FinanceEventModule;

  /**
   * Event that this rule handles.
   */
  event: FinanceEventType;

  /**
   * Whether this event represents a reversal of a
   * previous financial effect.
   */
  isReversal: boolean;

  /**
   * Whether the event requires a service reference.
   */
  requiresService: boolean;

  /**
   * Whether the event requires a candidate.
   */
  requiresCandidate: boolean;

  /**
   * Whether the event requires a finance party.
   */
  requiresParty: boolean;

  /**
   * Human-readable financial effect.
   *
   * Example:
   *
   * "Service cost"
   * "Customer payment"
   * "Vendor payment"
   * "Advance received"
   */
  effect: string;
}

/**
 * Service completion rule.
 *
 * This is intentionally generic.
 *
 * Specific service modules such as Medical, MOFA,
 * Visa, Flight, etc. can use the same service.completed
 * financial behavior.
 */
const SERVICE_COMPLETED_RULE: FinanceEventRule = {
  module: "system",
  event: "service.completed",
  isReversal: false,
  requiresService: true,
  requiresCandidate: false,
  requiresParty: false,
  effect: "Service financial cost or revenue",
};

/**
 * Service cancellation rule.
 */
const SERVICE_CANCELLED_RULE: FinanceEventRule = {
  module: "system",
  event: "service.cancelled",
  isReversal: true,
  requiresService: true,
  requiresCandidate: false,
  requiresParty: false,
  effect: "Service financial reversal",
};

/**
 * Service reversal rule.
 */
const SERVICE_REVERSED_RULE: FinanceEventRule = {
  module: "system",
  event: "service.reversed",
  isReversal: true,
  requiresService: true,
  requiresCandidate: false,
  requiresParty: false,
  effect: "Service financial reversal",
};

/**
 * Payment received rule.
 */
const PAYMENT_RECEIVED_RULE: FinanceEventRule = {
  module: "system",
  event: "payment.received",
  isReversal: false,
  requiresService: false,
  requiresCandidate: false,
  requiresParty: true,
  effect: "Actual money received",
};

/**
 * Payment made rule.
 */
const PAYMENT_MADE_RULE: FinanceEventRule = {
  module: "system",
  event: "payment.made",
  isReversal: false,
  requiresService: false,
  requiresCandidate: false,
  requiresParty: true,
  effect: "Actual money paid",
};

/**
 * Refund issued rule.
 */
const REFUND_ISSUED_RULE: FinanceEventRule = {
  module: "system",
  event: "refund.issued",
  isReversal: true,
  requiresService: false,
  requiresCandidate: false,
  requiresParty: true,
  effect: "Actual money refunded",
};

/**
 * Refund received rule.
 */
const REFUND_RECEIVED_RULE: FinanceEventRule = {
  module: "system",
  event: "refund.received",
  isReversal: true,
  requiresService: false,
  requiresCandidate: false,
  requiresParty: true,
  effect: "Refund received back",
};

/**
 * Advance received rule.
 *
 * Important:
 *
 * Advance is NOT revenue.
 *
 * It represents money received before the related
 * service/financial consumption is completed.
 */
const ADVANCE_RECEIVED_RULE: FinanceEventRule = {
  module: "system",
  event: "advance.received",
  isReversal: false,
  requiresService: false,
  requiresCandidate: false,
  requiresParty: true,
  effect: "Advance received",
};

/**
 * Advance consumed rule.
 *
 * Important:
 *
 * Consumption of an advance is not the same thing
 * as receiving cash.
 */
const ADVANCE_CONSUMED_RULE: FinanceEventRule = {
  module: "system",
  event: "advance.consumed",
  isReversal: false,
  requiresService: false,
  requiresCandidate: false,
  requiresParty: true,
  effect: "Advance balance consumed",
};

/**
 * Advance refunded rule.
 */
const ADVANCE_REFUNDED_RULE: FinanceEventRule = {
  module: "system",
  event: "advance.refunded",
  isReversal: true,
  requiresService: false,
  requiresCandidate: false,
  requiresParty: true,
  effect: "Advance refunded",
};

/**
 * Registry definitions.
 *
 * We keep the registry as a list rather than a large nested
 * object so it remains easy to extend and inspect.
 */
const FINANCE_EVENT_RULES: readonly FinanceEventRule[] = [
  SERVICE_COMPLETED_RULE,
  SERVICE_CANCELLED_RULE,
  SERVICE_REVERSED_RULE,
  PAYMENT_RECEIVED_RULE,
  PAYMENT_MADE_RULE,
  REFUND_ISSUED_RULE,
  REFUND_RECEIVED_RULE,
  ADVANCE_RECEIVED_RULE,
  ADVANCE_CONSUMED_RULE,
  ADVANCE_REFUNDED_RULE,
];

/**
 * Find a financial rule for an ERP event.
 *
 * The registry currently treats the event type as the
 * primary financial rule.
 *
 * The ERP module remains part of the event so the same
 * engine can later apply module-specific mappings.
 */
export function getFinanceEventRule(
  event: FinanceEventInput,
): FinanceEventRule {
  const rule = FINANCE_EVENT_RULES.find(
    (item) => item.event === event.event,
  );

  if (!rule) {
    throw new FinanceEventRegistryError(
      `No finance rule registered for event "${event.event}".`,
    );
  }

  return {
    ...rule,
    module: event.module,
  };
}

/**
 * Check whether a financial event is registered.
 */
export function hasFinanceEventRule(
  event: FinanceEventInput,
): boolean {
  return FINANCE_EVENT_RULES.some(
    (item) => item.event === event.event,
  );
}

/**
 * Return all registered event rules.
 *
 * Useful for debugging, documentation, or future
 * Finance configuration screens.
 */
export function getFinanceEventRules(): readonly FinanceEventRule[] {
  return FINANCE_EVENT_RULES;
}