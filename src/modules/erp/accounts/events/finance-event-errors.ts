/**
 * Base error for all Finance Event Engine failures.
 *
 * All engine-specific errors extend this class so callers
 * can identify Finance Event Engine failures consistently.
 */
export class FinanceEventError extends Error {
  readonly code: string;

  constructor(
    message: string,
    code = "FINANCE_EVENT_ERROR",
  ) {
    super(message);

    this.name = "FinanceEventError";
    this.code = code;

    // Required for correct instanceof behavior when extending Error.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Raised when an incoming finance event does not satisfy
 * the required business/financial contract.
 */
export class FinanceEventValidationError extends FinanceEventError {
  constructor(message: string) {
    super(
      message,
      "FINANCE_EVENT_VALIDATION_ERROR",
    );

    this.name = "FinanceEventValidationError";
  }
}

/**
 * Raised when the engine cannot convert an event into
 * a valid Finance transaction structure.
 */
export class FinanceEventMappingError extends FinanceEventError {
  constructor(message: string) {
    super(
      message,
      "FINANCE_EVENT_MAPPING_ERROR",
    );

    this.name = "FinanceEventMappingError";
  }
}

/**
 * Raised when the engine cannot resolve the required
 * tenant/user/ERP context.
 */
export class FinanceEventContextError extends FinanceEventError {
  constructor(message: string) {
    super(
      message,
      "FINANCE_EVENT_CONTEXT_ERROR",
    );

    this.name = "FinanceEventContextError";
  }
}

/**
 * Raised when an event is not allowed by the
 * Finance Event Registry.
 */
export class FinanceEventRegistryError extends FinanceEventError {
  constructor(message: string) {
    super(
      message,
      "FINANCE_EVENT_REGISTRY_ERROR",
    );

    this.name = "FinanceEventRegistryError";
  }
}

/**
 * Raised when an event has already been processed.
 *
 * This protects Finance from duplicate transactions caused
 * by retries, double clicks, network retries, offline sync,
 * or backend retries.
 */
export class FinanceEventDuplicateError extends FinanceEventError {
  readonly idempotencyKey: string;

  constructor(
    message: string,
    idempotencyKey: string,
  ) {
    super(
      message,
      "FINANCE_EVENT_DUPLICATE",
    );

    this.name = "FinanceEventDuplicateError";
    this.idempotencyKey = idempotencyKey;
  }
}

/**
 * Raised when the Finance Event Engine fails while
 * creating the financial transaction.
 */
export class FinanceEventProcessingError extends FinanceEventError {
  constructor(message: string) {
    super(
      message,
      "FINANCE_EVENT_PROCESSING_ERROR",
    );

    this.name = "FinanceEventProcessingError";
  }
}