import { apiClient } from "@/lib/api-client";
import type { Budget, BudgetPeriod } from "@/types";

export interface BudgetProgressResponse {
  id: string;
  owner_user_id: string | null;
  owner_household_id: string | null;
  category_id: string;
  name: string;
  target_amount: number;
  period: BudgetPeriod;
  start_date: string;
  current_period: {
    id: string;
    period_start: string;
    period_end: string;
    carried_deficit: number;
  } | null;
  carried_deficit: number;
  effective_target: number;
  spent_amount: number;
  total_reserved: number;
  remaining_budget: number;
  deficit_amount: number;
  is_overbudget: boolean;
}

export function toBudget(res: BudgetProgressResponse): Budget {
  return {
    id: res.id,
    owner_user_id: res.owner_user_id,
    owner_household_id: res.owner_household_id,
    category_id: res.category_id,
    name: res.name,
    target_amount: res.target_amount,
    period: res.period,
    start_date: res.start_date,
  };
}

export async function listBudgets(): Promise<BudgetProgressResponse[]> {
  const res = await apiClient.get<{ data: BudgetProgressResponse[] }>("/budgets");
  return res.data.data;
}

export async function createBudget(data: {
  owner_type: "user" | "household";
  category_id: string;
  name: string;
  target_amount: number;
  period: BudgetPeriod;
}): Promise<{ id: string }> {
  const res = await apiClient.post<{ data: { id: string } }>("/budgets", data);
  return res.data.data;
}

export async function updateBudget(
  id: string,
  data: { category_id?: string; name?: string; target_amount?: number; period?: BudgetPeriod }
): Promise<BudgetProgressResponse> {
  const res = await apiClient.patch<{ data: BudgetProgressResponse }>(`/budgets/${id}`, data);
  return res.data.data;
}

export async function deleteBudget(id: string): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}

export async function closePeriod(id: string): Promise<BudgetProgressResponse> {
  const res = await apiClient.post<{ data: BudgetProgressResponse }>(`/budgets/${id}/close-period`);
  return res.data.data;
}

export interface EncroachmentResponse {
  id: string;
  transaction_id: string;
  wallet_id: string;
  budget_id: string | null;
  goal_id: string | null;
  amount: number;
  created_at: string;
}

export async function listBudgetEncroachments(budgetId: string): Promise<EncroachmentResponse[]> {
  const res = await apiClient.get<{ data: EncroachmentResponse[] }>(`/budgets/${budgetId}/encroachments`);
  return res.data.data;
}

export async function listBudgetReservations(budgetId: string) {
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
  }>(`/budgets/${budgetId}/reservations`);
  return res.data.data;
}
