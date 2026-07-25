export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  entity_type: string;
  entity_id: string;
  action: string;
  details: string;
  before_data?: Record<string, unknown> | null;
  after_data?: Record<string, unknown> | null;
  created_at: string;
}
