export interface Agent {
  id: string;
  created_at: string;
  name: string | null;
  code: string | null;
  phone: string | null;
  tenant_id: string;
}