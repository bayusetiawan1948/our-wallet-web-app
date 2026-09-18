import { apiClient } from "@/lib/api-client";
import type { Wallet, WalletReconciliation, WalletType } from "@/types";

interface WalletResponse {
  id: string;
  owner_user_id: string | null;
  owner_household_id: string | null;
  name: string;
  type: WalletType;
  currency: string;
  balance: number;
}

interface ReconciliationResponse {
  id: string;
  wallet_id: string;
  recorded_balance: number;
  actual_balance: number;
  date: string;
  adjustment_transaction_id: string | null;
}

function toWallet(res: WalletResponse): Wallet {
  return {
    id: res.id,
    owner_user_id: res.owner_user_id,
    owner_household_id: res.owner_household_id,
    name: res.name,
    type: res.type,
    currency: res.currency,
    balance: res.balance,
  };
}

function toReconciliation(res: ReconciliationResponse): WalletReconciliation {
  return {
    id: res.id,
    wallet_id: res.wallet_id,
    recorded_balance: res.recorded_balance,
    actual_balance: res.actual_balance,
    date: res.date,
    adjustment_transaction_id: res.adjustment_transaction_id,
  };
}

export async function listWallets(): Promise<Wallet[]> {
  const res = await apiClient.get<{ data: WalletResponse[] }>("/wallets");
  return res.data.data.map(toWallet);
}

export async function createWallet(data: {
  name: string;
  type: WalletType;
  currency?: string;
  initial_balance?: number;
  owner_type: "user" | "household";
  owner_user_id?: string;
}): Promise<Wallet> {
  const res = await apiClient.post<{ data: WalletResponse }>("/wallets", data);
  return toWallet(res.data.data);
}

export async function updateWallet(
  id: string,
  data: {
    name?: string;
    type?: WalletType;
    owner_type?: "user" | "household";
    owner_user_id?: string;
  }
): Promise<Wallet> {
  const res = await apiClient.patch<{ data: WalletResponse }>(`/wallets/${id}`, data);
  return toWallet(res.data.data);
}

export async function deleteWallet(id: string): Promise<void> {
  await apiClient.delete(`/wallets/${id}`);
}

export async function grantAccess(walletId: string, userId: string): Promise<void> {
  await apiClient.post(`/wallets/${walletId}/access`, { user_id: userId });
}

export async function revokeAccess(walletId: string, userId: string): Promise<void> {
  await apiClient.delete(`/wallets/${walletId}/access/${userId}`);
}

export async function createReconciliation(
  walletId: string,
  actualBalance: number
): Promise<WalletReconciliation> {
  const res = await apiClient.post<{ data: ReconciliationResponse }>(
    `/wallets/${walletId}/reconciliations`,
    { actual_balance: actualBalance }
  );
  return toReconciliation(res.data.data);
}

export async function listReconciliations(walletId: string): Promise<WalletReconciliation[]> {
  const res = await apiClient.get<{ data: ReconciliationResponse[] }>(
    `/wallets/${walletId}/reconciliations`
  );
  return res.data.data.map(toReconciliation);
}
