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
