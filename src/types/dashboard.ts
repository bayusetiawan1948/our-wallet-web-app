export type HistoryGranularity = "day" | "week" | "month"

export interface DashboardHistoryPoint {
  date: string
  wallet_balance: number
  investment_value: number
  invested_capital: number
  total_assets: number
  liabilities: number
  net_worth: number
}

export interface DashboardHistory {
  from: string
  to: string
  granularity: HistoryGranularity
  points: DashboardHistoryPoint[]
}
