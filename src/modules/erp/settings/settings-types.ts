export type NumberingEntity =
  | "candidate"
  | "agent"
  | "agency";

export interface NumberingState {
  entity: NumberingEntity;
  currentHighest: number;
  nextNumber: number;
}

export interface NumberingSetting {
  entity: NumberingEntity;
  label: string;
  description: string;
  enabled: boolean;
}