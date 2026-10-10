export interface Agent {
  id: string;
  tenant_id: string;
  sl: number;
  code: string | null;
  name: string | null;
  phone: string | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}