export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export interface Budget {
  id: string;
  category_id: string;
  owner_user_id?: string | null;
  owner_household_id?: string | null;
  name: string;
  target_amount: number;
  period: BudgetPeriod;
  start_date: string;
}

export interface BudgetPeriodRecord {
  id: string;
  budget_id: string;
  period_start: string;
  period_end: string;
  target_amount: number;
  carried_deficit: number;
  status: "active" | "closed";
}

export type GoalStatus = "active" | "completed" | "cancelled";

export interface Goal {
  id: string;
  owner_user_id?: string | null;
  owner_household_id?: string | null;
  name: string;
  target_amount: number;
  target_date?: string | null;
  status: GoalStatus;
  notes?: string;
}

export type AllocationMethod = "manual" | "percentage" | "formula";

export interface Reservation {
  id: string;
  wallet_id: string;
  budget_id?: string | null;
  goal_id?: string | null;
  reserved_amount: number;
  allocation_method: AllocationMethod;
  allocation_config?: {
    percentage?: number;
    formula?: string;
  } | null;
}

export interface BudgetEncroachment {
  id: string;
  transaction_id: string;
  wallet_id: string;
  budget_id?: string | null;
  goal_id?: string | null;
  amount: number;
  created_at: string;
  note?: string;
}
