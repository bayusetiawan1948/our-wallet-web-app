import { apiClient } from "@/lib/api-client";

export interface HouseholdMemberResponse {
  user_id: string;
  name: string;
  email: string;
  base_currency: string;
  role: "admin" | "member";
  can_edit_others_transactions: boolean;
}

export async function listMembers(): Promise<HouseholdMemberResponse[]> {
  const res = await apiClient.get<{ data: HouseholdMemberResponse[] }>(
    "/households/members"
  );
  return res.data.data;
}

export async function createHousehold(name: string): Promise<{ id: string; name: string }> {
  const res = await apiClient.post<{ data: { id: string; name: string } }>("/households", { name });
  return res.data.data;
}

export async function acceptInvite(code: string): Promise<{ id: string; name: string }> {
  const res = await apiClient.post<{ data: { id: string; name: string } }>(
    "/households/invites/accept",
    { code }
  );
  return res.data.data;
}

export async function createInvite(): Promise<string> {
  const res = await apiClient.post<{ data: { code: string } }>("/households/invites");
  return res.data.data.code;
}
