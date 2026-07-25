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
