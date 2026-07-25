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
