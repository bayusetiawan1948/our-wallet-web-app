import { apiClient } from "@/lib/api-client";
import type { AllocationMethod, Reservation } from "@/types";

type AllocationConfig = { percentage?: number; formula?: string };

interface ReservationResponse {
  id: string;
  wallet_id: string;
  budget_id: string | null;
  goal_id: string | null;
  reserved_amount: number;
  allocation_method: AllocationMethod;
  allocation_config: AllocationConfig | null;
}

function toReservation(res: ReservationResponse): Reservation {
  return {
    id: res.id,
    wallet_id: res.wallet_id,
    budget_id: res.budget_id ?? undefined,
    goal_id: res.goal_id ?? undefined,
    reserved_amount: res.reserved_amount,
    allocation_method: res.allocation_method,
    allocation_config: res.allocation_config ?? undefined,
  };
}

export async function listReservationsByWallet(walletId: string): Promise<Reservation[]> {
  const res = await apiClient.get<{ data: ReservationResponse[] }>("/reservations", {
    params: { wallet_id: walletId },
  });
  return res.data.data.map(toReservation);
}

export async function createReservation(data: {
  wallet_id: string;
  budget_id?: string;
  goal_id?: string;
  reserved_amount: number;
  allocation_method?: AllocationMethod;
  allocation_config?: AllocationConfig;
}): Promise<Reservation> {
  const res = await apiClient.post<{ data: ReservationResponse }>("/reservations", data);
  return toReservation(res.data.data);
}

export async function deleteReservation(id: string): Promise<void> {
  await apiClient.delete(`/reservations/${id}`);
}
