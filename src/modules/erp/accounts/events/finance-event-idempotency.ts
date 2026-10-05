import type {
  FinanceEventInput,
} from "./finance-event-types";

/**
 * Result of resolving an event's idempotency identity.
 */
export interface FinanceEventIdempotency {
  /**
   * Stable key used to identify the same business event.
   */
  key: string;

  /**
   * Original event source.
   */
  sourceType: FinanceEventInput["source"]["type"];

  /**
   * Original ERP record id.
   */
  sourceId: string;

  /**
   * Event type.
   */
  event: FinanceEventInput["event"];
}

/**
 * Normalize a string before using it inside an idempotency key.
 *
 * This prevents accidental differences such as:
 *
 * " MEDICAL "
 * "medical"
 *
 * from creating different keys.
 */
function normalizeKeyPart(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/**
 * Build a stable idempotency key for a Finance Event.
 *
 * The key represents the business event, not the generated
 * Finance transaction.
 *
 * Example:
 *
 * medical
 * +
 * medical-id
 * +
 * service.completed
 *
 * becomes:
 *
 * medical:medical-id:service.completed
 *
 * This is intentionally deterministic.
 */
export function buildFinanceEventIdempotencyKey(
  event: FinanceEventInput,
): string {
  const sourceType = normalizeKeyPart(
    event.source.type,
  );

  const sourceId = normalizeKeyPart(
    event.source.id,
  );

  const eventType = normalizeKeyPart(
    event.event,
  );

  return [
    sourceType,
    sourceId,
    eventType,
  ].join(":");
}

/**
 * Resolve the complete idempotency information
 * for a Finance Event.
 */
export function resolveFinanceEventIdempotency(
  event: FinanceEventInput,
): FinanceEventIdempotency {
  return {
    key: buildFinanceEventIdempotencyKey(event),

    sourceType: event.source.type,

    sourceId: event.source.id,

    event: event.event,
  };
}

/**
 * Compare two Finance Events using their business identity.
 *
 * This is useful before persistent idempotency storage
 * is introduced.
 */
export function isSameFinanceEvent(
  first: FinanceEventInput,
  second: FinanceEventInput,
): boolean {
  return (
    buildFinanceEventIdempotencyKey(first) ===
    buildFinanceEventIdempotencyKey(second)
  );
}