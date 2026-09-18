import { apiClient } from "@/lib/api-client";
import type { AssetType, Investment, InvestmentTransaction, InvestmentValuation } from "@/types";

interface InvestmentResponse {
  id: string;
  owner_user_id: string | null;
  owner_household_id: string | null;
  asset_type: AssetType;
  asset_name: string;
  unit: string;
  latest_price_per_unit: number | null;
  quantity_held: number;
}

export interface InvestmentWithValuation extends Investment {
  latest_price_per_unit: number | null;
  quantity_held: number;
}

interface InvestmentTransactionResponse {
  id: string;
  investment_id: string;
  wallet_id: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
  status: "active" | "void";
  correction_of_id: string | null;
}

interface InvestmentValuationResponse {
  id: string;
  investment_id: string;
  price_per_unit: number;
  date: string;
  source: "manual" | "scrape" | "api";
}

function toInvestment(res: InvestmentResponse): InvestmentWithValuation {
  return {
    id: res.id,
    owner_user_id: res.owner_user_id,
    owner_household_id: res.owner_household_id,
    asset_type: res.asset_type,
    asset_name: res.asset_name,
    unit: res.unit,
    latest_price_per_unit: res.latest_price_per_unit,
    quantity_held: res.quantity_held,
  };
}

function toTransaction(res: InvestmentTransactionResponse): InvestmentTransaction {
  return {
    id: res.id,
    investment_id: res.investment_id,
    wallet_id: res.wallet_id,
    type: res.type,
    quantity: res.quantity,
    price: res.price,
    date: res.date,
    status: res.status,
    correction_of_id: res.correction_of_id,
  };
}

function toValuation(res: InvestmentValuationResponse): InvestmentValuation {
  return {
    id: res.id,
    investment_id: res.investment_id,
    price_per_unit: res.price_per_unit,
    date: res.date,
    source: res.source,
  };
}

export async function listInvestments(): Promise<InvestmentWithValuation[]> {
  const res = await apiClient.get<{ data: InvestmentResponse[] }>("/investments");
  return res.data.data.map(toInvestment);
}

export async function createInvestment(data: {
  owner_type: "user" | "household";
  asset_type: AssetType;
  asset_name: string;
  unit: string;
  initial_price?: number;
}): Promise<InvestmentWithValuation> {
  const res = await apiClient.post<{ data: InvestmentResponse }>("/investments", data);
  return toInvestment(res.data.data);
}

export async function listTransactions(investmentId: string): Promise<InvestmentTransaction[]> {
  const res = await apiClient.get<{ data: InvestmentTransactionResponse[] }>(
    `/investments/${investmentId}/transactions`
  );
  return res.data.data.map(toTransaction);
}

export async function addTransaction(
  investmentId: string,
  data: { wallet_id: string; type: "buy" | "sell"; quantity: number; price: number; date: string }
): Promise<InvestmentTransaction> {
  const res = await apiClient.post<{ data: InvestmentTransactionResponse }>(
    `/investments/${investmentId}/transactions`,
    data
  );
  return toTransaction(res.data.data);
}

export async function addValuation(
  investmentId: string,
  pricePerUnit: number
): Promise<InvestmentValuation> {
  const res = await apiClient.post<{ data: InvestmentValuationResponse }>(
    `/investments/${investmentId}/valuations`,
    { price_per_unit: pricePerUnit }
  );
  return toValuation(res.data.data);
}
