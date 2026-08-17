export interface Agent {
  id: number;
  created_at: string;
  name: string | null;
  code: string | null;
  tenant_id: string;
}