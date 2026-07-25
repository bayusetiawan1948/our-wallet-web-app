export type CategoryType = "income" | "expense" | "both";

export interface Category {
  id: string;
  household_id: string;
  parent_id?: string | null;
  name: string;
  type: CategoryType;
  is_system: boolean;
  is_active: boolean;
  icon?: string;
}
