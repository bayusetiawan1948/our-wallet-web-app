import { apiClient } from "@/lib/api-client";

export interface AuditLogResponse {
  id: string;
  actor_id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
}

export async function listAuditLogs(): Promise<AuditLogResponse[]> {
  const res = await apiClient.get<{ data: AuditLogResponse[] }>("/audit-logs");
  return res.data.data;
}
