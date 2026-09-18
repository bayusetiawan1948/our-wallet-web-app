import { apiClient } from "@/lib/api-client";
import type { Debt, DebtPayment, DebtType } from "@/types";

interface DebtResponse {
  id: string;
  owner_user_id: string | null;
  owner_household_id: string | null;
  type: DebtType;
  counterparty: string;
  principal: number;
  portion_admin: number;
  portion_member: number;
  due_date: string | null;
  status: "active" | "partial" | "paid" | "overdue" | "cancelled";
  note: string | null;
}

interface DebtPaymentResponse {
  id: string;
  debt_id: string;
  wallet_id: string;
  amount: number;
  date: string;
  status: "active" | "void";
  correction_of_id: string | null;
}

function toDebt(res: DebtResponse): Debt {
  return {
    id: res.id,
    owner_user_id: res.owner_user_id,
    owner_household_id: res.owner_household_id,
    type: res.type,
    counterparty: res.counterparty,
    principal: res.principal,
    portion_admin: res.portion_admin,
    portion_member: res.portion_member,
    due_date: res.due_date ?? "",
    status: res.status,
    note: res.note ?? undefined,
  };
}

function toPayment(res: DebtPaymentResponse): DebtPayment {
  return {
    id: res.id,
    debt_id: res.debt_id,
    wallet_id: res.wallet_id,
    amount: res.amount,
    date: res.date,
    status: res.status,
    correction_of_id: res.correction_of_id,
  };
}

export async function listDebts(): Promise<Debt[]> {
  const res = await apiClient.get<{ data: DebtResponse[] }>("/debts");
  return res.data.data.map(toDebt);
}

export async function createDebt(data: {
  owner_type: "user" | "household";
  type: DebtType;
  counterparty: string;
  principal: number;
  portion_admin?: number;
  portion_member?: number;
  due_date?: string;
  note?: string;
}): Promise<Debt> {
  const res = await apiClient.post<{ data: DebtResponse }>("/debts", data);
  return toDebt(res.data.data);
}

export async function updateDebt(
  id: string,
  data: {
    type?: DebtType;
    counterparty?: string;
    principal?: number;
    portion_admin?: number;
    portion_member?: number;
    due_date?: string;
    note?: string;
  }
): Promise<Debt> {
  const res = await apiClient.patch<{ data: DebtResponse }>(`/debts/${id}`, data);
  return toDebt(res.data.data);
}

export async function deleteDebt(id: string): Promise<void> {
  await apiClient.delete(`/debts/${id}`);
}

export async function addPayment(
  debtId: string,
  data: { wallet_id: string; amount: number; date: string }
): Promise<DebtPayment> {
  const res = await apiClient.post<{ data: DebtPaymentResponse }>(
    `/debts/${debtId}/payments`,
    data
  );
  return toPayment(res.data.data);
}

export async function listPayments(debtId: string): Promise<DebtPayment[]> {
  const res = await apiClient.get<{ data: DebtPaymentResponse[] }>(
    `/debts/${debtId}/payments`
  );
  return res.data.data.map(toPayment);
}

export async function voidPayment(debtId: string, paymentId: string): Promise<DebtPayment> {
  const res = await apiClient.post<{ data: DebtPaymentResponse }>(
    `/debts/${debtId}/payments/${paymentId}/void`
  );
  return toPayment(res.data.data);
}
