import { apiClient } from "@/lib/api-client";
import type { Goal, GoalStatus } from "@/types";

export interface GoalProgressResponse {
  id: string;
  owner_user_id: string | null;
  owner_household_id: string | null;
  name: string;
  target_amount: number;
  target_date: string | null;
  status: GoalStatus;
  total_reserved: number;
  progress_percent: number;
  remaining_amount: number;
  is_completed: boolean;
}

export function toGoal(res: GoalProgressResponse): Goal {
  return {
    id: res.id,
    owner_user_id: res.owner_user_id,
    owner_household_id: res.owner_household_id,
    name: res.name,
    target_amount: res.target_amount,
    target_date: res.target_date ?? undefined,
    status: res.status,
  };
}

export async function listGoals(): Promise<GoalProgressResponse[]> {
  const res = await apiClient.get<{ data: GoalProgressResponse[] }>("/goals");
  return res.data.data;
}

export async function createGoal(data: {
  owner_type: "user" | "household";
  name: string;
  target_amount: number;
  target_date?: string;
}): Promise<{ id: string }> {
  const res = await apiClient.post<{ data: { id: string } }>("/goals", data);
  return res.data.data;
}

export async function updateGoal(
  id: string,
  data: { name?: string; target_amount?: number; target_date?: string; status?: GoalStatus }
): Promise<GoalProgressResponse> {
  const res = await apiClient.patch<{ data: GoalProgressResponse }>(`/goals/${id}`, data);
  return res.data.data;
}

export async function deleteGoal(id: string): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}

export async function listGoalEncroachments(goalId: string) {
  const res = await apiClient.get<{
    data: {
      id: string;
      transaction_id: string;
      wallet_id: string;
      budget_id: string | null;
      goal_id: string | null;
      amount: number;
      created_at: string;
    }[];
  }>(`/goals/${goalId}/encroachments`);
  return res.data.data;
}

export async function listGoalReservations(goalId: string) {
  const res = await apiClient.get<{
    data: {
      id: string;
      wallet_id: string;
      budget_id: string | null;
      goal_id: string | null;
      reserved_amount: number;
      allocation_method: string;
      allocation_config: Record<string, unknown> | null;
    }[];
  }>(`/goals/${goalId}/reservations`);
  return res.data.data;
}
