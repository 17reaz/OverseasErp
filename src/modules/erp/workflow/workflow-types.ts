export type MainCandidateStatus =
  | "active"
  | "complete"
  | "return"
  | "cancel";

export type WorkflowState =
  | "processing"
  | "hold";

export type HoldReason =
  | "medical_expired"
  | "mofa_expired"
  | "visa_expired"
  | "iqama_overdue"
  | "manual_hold"
  | null;

export interface CandidateWorkflowState {
  mainStatus: MainCandidateStatus;
  workflowState: WorkflowState;
  currentStage: string | null;
  holdReason: HoldReason;
}