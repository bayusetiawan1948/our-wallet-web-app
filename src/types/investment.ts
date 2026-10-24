import { type RecordStatus } from "./transaction";

export type AssetType = "emas" | "perak" | "crypto" | "saham" | "reksadana" | "obligasi" | "lainnya";

export type InvestmentTransactionType = "buy" | "sell" | "opening";

export interface Investment {
  id: string;
  owner_user_id?: string | null;
  owner_household_id?: string | null;
  asset_type: AssetType;
  asset_name: string;
  unit: string;
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  wallet_id: string | null; // null untuk kepemilikan awal (opening)
  type: InvestmentTransactionType;
  quantity: number;
  price: number; // price per unit at transaction time
  date: string;
  status: RecordStatus;
  correction_of_id?: string | null;
}

export interface InvestmentValuation {
  id: string;
  investment_id: string;
  price_per_unit: number;
  date: string;
  source: "manual" | "scrape" | "api";
}
