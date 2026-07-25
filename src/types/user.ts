export type UserRole = "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  base_currency: string;
  avatar?: string;
}

export interface Household {
  id: string;
  name: string;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  role: UserRole;
  can_edit_others_transactions: boolean;
}

export interface HouseholdInvite {
  id: string;
  household_id: string;
  invited_by: string;
  code: string;
  status: "pending" | "accepted" | "expired";
  expires_at: string;
}
