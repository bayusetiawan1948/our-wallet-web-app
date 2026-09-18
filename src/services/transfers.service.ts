import { apiClient } from "@/lib/api-client";
import type { Transfer } from "@/types";

interface TransferResponse {
  id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  fee: number;
  date: string;
  status: "active" | "void";
  correction_of_id: string | null;
}

function toTransfer(res: TransferResponse): Transfer {
  return {
    id: res.id,
    from_wallet_id: res.from_wallet_id,
    to_wallet_id: res.to_wallet_id,
    amount: res.amount,
    fee: res.fee,
    date: res.date,
    status: res.status,
    correction_of_id: res.correction_of_id,
  };
}

export async function listTransfers(walletId?: string): Promise<Transfer[]> {
  const res = await apiClient.get<{ data: TransferResponse[] }>("/transfers", {
    params: walletId ? { wallet_id: walletId } : undefined,
  });
  return res.data.data.map(toTransfer);
}

export async function createTransfer(data: {
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  fee?: number;
  date: string;
}): Promise<Transfer> {
  const res = await apiClient.post<{ data: TransferResponse }>("/transfers", data);
  return toTransfer(res.data.data);
}

export async function voidTransfer(id: string): Promise<Transfer> {
  const res = await apiClient.post<{ data: TransferResponse }>(`/transfers/${id}/void`);
  return toTransfer(res.data.data);
}
