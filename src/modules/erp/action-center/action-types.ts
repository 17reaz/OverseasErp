export type ActionModule =
  | "candidate"
  | "medical"
  | "mofa"
  | "finger"
  | "police-clearance"
  | "takamul"
  | "visa"
  | "flight"
  | "files"
  | "agency";

export type ActionPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ActionType =
  | "candidate_incomplete"
  | "medical_pending"
  | "medical_expiring"
  | "medical_unfit"
  | "mofa_pending"
  | "mofa_expiring"
  | "finger_pending"
  | "police_clearance_pending"
  | "takamul_pending"
  | "visa_pending"
  | "visa_expiring"
  | "flight_pending"
  | "document_missing"
  | "candidate_on_hold";

export type ActionTarget = {
  module: ActionModule;

  /**
   * Route inside ERP.
   *
   * Example:
   * /app/medical
   * /app/candidates/uuid
   */
  route: string;

  /**
   * Optional candidate context.
   */
  candidateId?: string;

  /**
   * Optional module record.
   */
  recordId?: string;

  /**
   * Optional screen inside module.
   *
   * Examples:
   * details
   * process
   * edit
   */
  screen?: string;
};

export type ActionCandidate = {
  id: string;

  sl?: number | null;

  name?: string | null;

  passportNo?: string | null;
};

export type ActionItem = {
  id: string;

  type: ActionType;

  title: string;

  description?: string;

  priority: ActionPriority;

  module: ActionModule;

  candidate?: ActionCandidate | null;

  target: ActionTarget;

  createdAt?: string;

  /**
   * Optional metadata.
   *
   * This allows future actions to carry
   * additional information without changing
   * the core ActionItem structure.
   */
  metadata?: Record<string, unknown>;
};