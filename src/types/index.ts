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

export type WalletType = "bank" | "ewallet" | "cash";

export interface Wallet {
  id: string;
  owner_user_id?: string | null;
  owner_household_id?: string | null;
  name: string;
  type: WalletType;
  currency: string;
  balance: number;
}

export interface WalletAccess {
  wallet_id: string;
  user_id: string;
  assigned_by: string;
}

export interface WalletReconciliation {
  id: string;
  wallet_id: string;
  recorded_balance: number;
  actual_balance: number;
  date: string;
  notes?: string;
  adjustment_transaction_id?: string | null;
}

export interface Category {
  id: string;
  household_id: string;
  parent_id?: string | null;
  name: string;
  is_system: boolean;
  is_hidden: boolean;
  icon?: string;
}

export type TransactionType = "income" | "expense";
export type RecordStatus = "active" | "void";

export interface Transaction {
  id: string;
  wallet_id: string;
  category_id: string;
  owner_id: string; // milik siapa uangnya (Bayu / Annisa)
  recorded_by: string; // siapa yang input
  type: TransactionType;
  amount: number;
  date: string;
  note: string;
  attachment_url?: string;
  status: RecordStatus;
  correction_of_id?: string | null;
}

export interface Transfer {
  id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  fee: number;
  date: string;
  note?: string;
  status: RecordStatus;
  correction_of_id?: string | null;
}

export type DebtType = "utang" | "piutang";
export type DebtStatus = "belum_lunas" | "cicilan" | "lunas";

export interface Debt {
  id: string;
  owner_user_id?: string | null;
  owner_household_id?: string | null;
  type: DebtType;
  counterparty: string;
  principal: number;
  portion_admin: number; // Bayu
  portion_member: number; // Annisa
  due_date: string;
  status: DebtStatus;
  note?: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  wallet_id: string;
  amount: number;
  date: string;
  status: RecordStatus;
  correction_of_id?: string | null;
  recorded_by: string;
}

export type AssetType = "emas" | "perak" | "crypto" | "saham";

export interface Investment {
  id: string;
  owner_user_id?: string | null;
  owner_household_id?: string | null;
  asset_type: AssetType;
  asset_name: string;
  unit: string;
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  wallet_id: string;
  type: "buy" | "sell";
  quantity: number;
  price: number; // price per unit at transaction time
  date: string;
  status: RecordStatus;
  correction_of_id?: string | null;
}

export interface InvestmentValuation {
  id: string;
  investment_id: string;
  price_per_unit: number;
  date: string;
  source: "manual" | "scrape" | "api";
}

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
