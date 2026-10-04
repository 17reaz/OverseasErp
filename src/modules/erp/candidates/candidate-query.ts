export const CANDIDATE_SELECT = `
  id,
  tenant_id,
  sl,
  passport_no,
  name,
  received_date,
  country,
  created_by,
  agent_id,
  agent:agents (
    id,
    name,
    code
  ),
  current_stage,
  workflow_state,
  hold_reason,
  workflow_updated_at,
  is_returned,
  returned_date,
  returned_reason,
  final_status,
  final_reason,
  is_deleted,
  created_at,
  updated_at
`;