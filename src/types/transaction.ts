export type TransactionType = "income" | "expense";
export type RecordStatus = "active" | "void";
export type TransactionSource =
  | "debt_create"
  | "debt_revision"
  | "debt_cancel"
  | "debt_payment"
  | "debt_payment_void"
  | "investment_buy"
  | "investment_sell"
  | "investment_void";

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
  // Terisi untuk entri hasil utang/piutang atau investasi; hanya bisa dibatalkan lewat menu asalnya.
  source?: TransactionSource | null;
  debt_id?: string | null;
  debt_payment_id?: string | null;
  investment_transaction_id?: string | null;
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
