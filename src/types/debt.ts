import { type RecordStatus } from "./transaction";

export type DebtType = "utang" | "piutang";
export type DebtStatus = "active" | "partial" | "paid" | "overdue" | "cancelled";

export interface Debt {
  id: string;
  owner_user_id?: string | null;
  owner_household_id?: string | null;
  type: DebtType;
  counterparty: string;
  principal: number;
  portion_admin?: number;
  portion_member?: number;
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
}
