import { type RecordStatus } from "./transaction";

export type DebtType = "utang" | "piutang";
export type DebtStatus = "belum_lunas" | "cicilan" | "lunas";

export interface Debt {
  id: string;
  owner_user_id?: string | null;
  owner_household_id?: string | null;
  created_by_user_id?: string | null; // Pembuat record utang/piutang
  assigned_to_user_id?: string | null; // Penanggung jawab utama (legacy / fallback)
  assigned_user_ids?: string[]; // Daftar member yang di-assign untuk bertanggung jawab / bayar
  type: DebtType;
  counterparty: string;
  principal: number;
  use_portion?: boolean;
  portion_admin?: number; // Bayu
  portion_member?: number; // Annisa
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
