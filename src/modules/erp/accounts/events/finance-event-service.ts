import {
  createTransactionGroup,
} from "@/modules/erp/accounts/transactions/transaction-group-service";

import {
  FinanceEventProcessingError,
} from "./finance-event-errors";

import {
  resolveFinanceEventIdempotency,
} from "./finance-event-idempotency";

import {
  getFinanceEventRule,
} from "./finance-event-registry";

import {
  getFinanceEventContext,
} from "./finance-event-context";

import {
  validateFinanceEvent,
} from "./finance-event-validator";

import {
  mapFinanceEventToTransactionGroup,
} from "./finance-event-mapper";

import type {
  FinanceEventInput,
  FinanceEventResult,
} from "./finance-event-types";

/**
 * Record a business event in Finance.
 *
 * This is the main public entry point for the
 * Finance Event Engine.
 *
 * ERP modules should call this function instead of
 * directly creating Finance transactions.
 */
export async function recordFinanceEvent(
  event: FinanceEventInput,
): Promise<FinanceEventResult> {
  /**
   * --------------------------------------------------
   * 1. Validate event structure
   * --------------------------------------------------
   *
   * This happens before any database operation.
   */
  validateFinanceEvent(event);

  /**
   * --------------------------------------------------
   * 2. Resolve authenticated ERP context
   * --------------------------------------------------
   *
   * This gives us:
   *
   * - authenticated user
   * - profile
   * - tenant
   *
   * The transaction engine itself also resolves the
   * authenticated context, but the Event Engine needs
   * the context boundary explicitly as well.
   */
  await getFinanceEventContext();

  /**
   * --------------------------------------------------
   * 3. Resolve idempotency information
   * --------------------------------------------------
   *
   * Current phase:
   *
   * We only generate a deterministic idempotency key.
   *
   * Persistent duplicate detection will be added later
   * when finance.finance_events is introduced.
   */
  const idempotency =
    resolveFinanceEventIdempotency(event);

  /**
   * --------------------------------------------------
   * 4. Resolve financial rule
   * --------------------------------------------------
   *
   * Registry tells us whether this event has a valid
   * financial meaning.
   */
  getFinanceEventRule(event);

  /**
   * --------------------------------------------------
   * 5. Convert event into transaction group
   * --------------------------------------------------
   */
  const plan =
    mapFinanceEventToTransactionGroup(event);

  /**
   * --------------------------------------------------
   * 6. Execute through existing Finance transaction
   *    engine
   * --------------------------------------------------
   *
   * Important:
   *
   * The Event Engine does NOT replace the existing
   * transaction engine.
   *
   * It only decides what financial transaction should
   * be created.
   */
  try {
    const group =
      await createTransactionGroup(
        plan.transactionGroup,
      );

    /**
     * ------------------------------------------------
     * 7. Return normalized result
     * ------------------------------------------------
     */
    return {
      event,

      transactionGroupId:
        group.id,

      transactionCount:
        group.transactions.length,

      status: "processed",
    };
  } catch (error) {
    /**
     * Preserve existing Finance Event errors.
     */
    if (
      error instanceof Error &&
      error.name.startsWith("FinanceEvent")
    ) {
      throw error;
    }

    /**
     * Convert lower-level transaction errors into
     * a Finance Event processing error.
     */
    const message =
      error instanceof Error
        ? error.message
        : "Unknown finance event processing error.";

    throw new FinanceEventProcessingError(
      `Failed to process finance event "${event.event}" ` +
      `with idempotency key "${idempotency.key}": ${message}`,
    );
  }
}