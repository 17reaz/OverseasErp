export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TaskPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

export type TaskModule =
  | "candidate"
  | "medical"
  | "mofa"
  | "finger"
  | "police_clearance"
  | "takamul"
  | "visa"
  | "bmet"
  | "flight"
  | "iqama"
  | "general";

export type Task = {
  id: string;
  tenant_id: string;

  title: string;
  description: string | null;

  status: TaskStatus;
  priority: TaskPriority;

  assigned_to: string | null;
  created_by: string | null;

  candidate_id: string | null;

  module: TaskModule | null;
  reference_id: string | null;

  due_at: string | null;
  completed_at: string | null;

  metadata: Record<string, unknown>;

  created_at: string;
  updated_at: string;

  candidate?: {
    id: string;
    name: string;
    passport_no: string;
  } | null;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;

  status?: TaskStatus;
  priority?: TaskPriority;

  assigned_to?: string | null;
  candidate_id?: string | null;

  module?: TaskModule | null;
  reference_id?: string | null;

  due_at?: string | null;
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  completed_at?: string | null;
};