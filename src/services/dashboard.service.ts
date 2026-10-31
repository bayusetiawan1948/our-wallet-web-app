import { apiClient } from "@/lib/api-client"
import type { DashboardHistory } from "@/types"

export async function getDashboardHistory(filter?: {
  from?: string
  to?: string
  wallet_ids?: string[]
}): Promise<DashboardHistory> {
  const res = await apiClient.get<{ data: DashboardHistory }>(
    "/dashboard/history",
    {
      params: {
        from: filter?.from,
        to: filter?.to,
        wallet_ids: filter?.wallet_ids?.length
          ? filter.wallet_ids.join(",")
          : undefined,
      },
    }
  )
  return res.data.data
}
