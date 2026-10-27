import { apiClient } from "@/lib/api-client";
import type { Transaction, TransactionSource, TransactionType } from "@/types";

interface TransactionResponse {
  id: string;
  wallet_id: string;
  category_id: string;
  owner_id: string;
  recorded_by: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string | null;
  attachment_url: string | null;
  status: "active" | "void";
  correction_of_id: string | null;
  source: TransactionSource | null;
  debt_id: string | null;
  debt_payment_id: string | null;
  investment_transaction_id: string | null;
}

function toTransaction(res: TransactionResponse): Transaction {
  return {
    id: res.id,
    wallet_id: res.wallet_id,
    category_id: res.category_id,
    owner_id: res.owner_id,
    recorded_by: res.recorded_by,
    type: res.type,
    amount: res.amount,
    date: res.date,
    note: res.note ?? "",
    attachment_url: res.attachment_url ?? undefined,
    status: res.status,
    correction_of_id: res.correction_of_id,
    source: res.source,
    debt_id: res.debt_id,
    debt_payment_id: res.debt_payment_id,
    investment_transaction_id: res.investment_transaction_id,
  };
}

export async function listTransactions(filter?: {
  wallet_id?: string;
  category_id?: string;
  from?: string;
  to?: string;
}): Promise<Transaction[]> {
  const res = await apiClient.get<{ data: TransactionResponse[] }>(
    "/transactions",
    { params: filter }
  );
  return res.data.data.map(toTransaction);
}

export async function createTransaction(data: {
  wallet_id: string;
  category_id: string;
  owner_id?: string;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
  encroachments?: Array<{ budget_id?: string; goal_id?: string; amount: number }>;
}): Promise<Transaction> {
  const res = await apiClient.post<{ data: TransactionResponse }>(
    "/transactions",
    data
  );
  return toTransaction(res.data.data);
}

export async function voidTransaction(id: string): Promise<Transaction> {
  const res = await apiClient.post<{ data: TransactionResponse }>(
    `/transactions/${id}/void`
  );
  return toTransaction(res.data.data);
}
