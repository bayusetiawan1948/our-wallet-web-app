import type { ReactElement, ReactNode } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { format, parseISO } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { ChartLineUpIcon } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCompactNumber, formatRupiah } from "@/libs/number"
import type {
  DashboardHistory,
  DashboardHistoryPoint,
  HistoryGranularity,
} from "@/types"

const PALETTE = [
  "#059669",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
]
const OTHER_COLOR = "#64748b"

const NET_WORTH_COLOR = "#059669"
const PORTFOLIO_COLOR = "#3b82f6"
const CAPITAL_COLOR = "#f59e0b"
const HISTORY_CHART_HEIGHT = 220

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] min-h-[220px] w-full flex-1 flex-col items-center justify-center gap-2 text-center">
      <ChartLineUpIcon className="size-6 text-muted-foreground/40" />
      <p className="max-w-[240px] font-mono text-xs text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

// --- TIME-SERIES HELPERS ---
interface HistoryChartProps {
  history: DashboardHistory | undefined
  isLoading: boolean
  isError: boolean
}

function formatAxisDate(date: string, granularity: HistoryGranularity): string {
  return format(parseISO(date), granularity === "month" ? "MMM yy" : "d MMM", {
    locale: idLocale,
  })
}

function formatFullDate(date: string): string {
  return format(parseISO(date), "d MMMM yyyy", { locale: idLocale })
}

function formatSigned(amount: number): string {
  return `${amount >= 0 ? "+" : "-"}${formatRupiah(Math.abs(amount))}`
}

function formatPercent(value: number | null): string {
  return value === null ? "" : ` (${value >= 0 ? "+" : ""}${value.toFixed(1)}%)`
}

function changeTone(amount: number): string {
  return amount >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400"
}

// Titik tanpa aset maupun liabilitas berarti belum ada data untuk digambar.
function hasNoActivity(history: DashboardHistory): boolean {
  return history.points.every(
    (point) => point.total_assets === 0 && point.liabilities === 0
  )
}

function HistoryChartFrame({
  history,
  isLoading,
  isError,
  emptyMessage,
  children,
}: HistoryChartProps & {
  emptyMessage: string
  children: (history: DashboardHistory) => ReactElement
}) {
  if (isLoading) {
    return <Skeleton className="h-[220px] w-full rounded-xs" />
  }

  if (isError) {
    return (
      <EmptyChartState message="Gagal memuat data historis. Coba muat ulang halaman." />
    )
  }

  if (!history || hasNoActivity(history)) {
    return <EmptyChartState message={emptyMessage} />
  }

  return (
    <div className="w-full min-w-0" style={{ height: HISTORY_CHART_HEIGHT }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={HISTORY_CHART_HEIGHT}
      >
        {children(history)}
      </ResponsiveContainer>
    </div>
  )
}

function HistoryTooltipFrame({
  point,
  children,
}: {
  point: DashboardHistoryPoint
  children: ReactNode
}) {
  return (
    <div className="min-w-[180px] rounded-xs border border-border bg-popover px-3 py-2 font-mono text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 border-b border-border/50 pb-1 text-muted-foreground">
        {formatFullDate(point.date)}
      </p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function HistoryTooltipRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-semibold num-financial ${valueClassName ?? "text-card-foreground"}`}
      >
        {value}
      </span>
    </div>
  )
}

const AXIS_TICK = { fontSize: 10 }
const Y_AXIS_WIDTH = 52

// --- NET WORTH TREND CARD ---
export function NetWorthTrendCard({
  history,
  isLoading,
  isError,
}: HistoryChartProps) {
  const points = history?.points ?? []
  const first = points[0]
  const last = points[points.length - 1]
  const change = first && last ? last.net_worth - first.net_worth : 0
  // Persentase hanya bermakna bila titik awal positif.
  const changePercent =
    first && first.net_worth > 0 ? (change / first.net_worth) * 100 : null
  const showChange =
    !isLoading &&
    !isError &&
    points.length > 1 &&
    !!history &&
    !hasNoActivity(history)

  return (
    <div className="flex h-full w-full flex-col justify-between gap-4 rounded-xs border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <div className="w-0.5 self-stretch bg-primary" />
          <h3 className="heading-sm font-mono tracking-tight text-card-foreground sm:heading-md">
            Net Worth Trend
          </h3>
          {showChange && (
            <span
              className={`ml-auto font-mono text-xs font-semibold num-financial ${changeTone(change)}`}
            >
              {formatSigned(change)}
              {formatPercent(changePercent)}
            </span>
          )}
        </div>
        <p className="pl-2.5 font-mono text-xs text-muted-foreground">
          Tren pertumbuhan nilai bersih (aset dikurangi liabilitas) pada periode
          yang dipilih.
        </p>
      </div>

      <HistoryChartFrame
        history={history}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada data saldo, investasi, atau utang pada periode ini."
      >
        {({ points, granularity }) => (
          <AreaChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="net-worth-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={NET_WORTH_COLOR}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={NET_WORTH_COLOR}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date: string) =>
                formatAxisDate(date, granularity)
              }
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value: number) => formatCompactNumber(value)}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={Y_AXIS_WIDTH}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 50 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const point = payload[0].payload as DashboardHistoryPoint
                return (
                  <HistoryTooltipFrame point={point}>
                    <HistoryTooltipRow
                      label="Net Worth"
                      value={formatRupiah(point.net_worth)}
                      valueClassName="text-emerald-600 dark:text-emerald-400"
                    />
                    <HistoryTooltipRow
                      label="Total Aset"
                      value={formatRupiah(point.total_assets)}
                    />
                    <HistoryTooltipRow
                      label="Liabilitas"
                      value={formatRupiah(point.liabilities)}
                    />
                  </HistoryTooltipFrame>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="net_worth"
              stroke={NET_WORTH_COLOR}
              strokeWidth={2}
              fill="url(#net-worth-fill)"
              dot={points.length < 3}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </HistoryChartFrame>
    </div>
  )
}

// --- WALLET DISTRIBUTION (PENYEBARAN UANG PER DOMPET) CARD ---
export interface WalletDistributionData {
  name: string
  amount: number
  formattedAmount: string
  percentage: number
  color: string
}

interface WalletSplitCardProps {
  wallets: { id: string; name: string; balance: number }[]
}

export function WalletSplitCard({ wallets }: WalletSplitCardProps) {
  const totalAmount = wallets.reduce((sum, w) => sum + w.balance, 0)

  const distribution: WalletDistributionData[] = wallets
    .filter((w) => w.balance > 0)
    .map((w, index) => ({
      name: w.name,
      amount: w.balance,
      formattedAmount: formatRupiah(w.balance),
      percentage:
        totalAmount > 0
          ? parseFloat(((w.balance / totalAmount) * 100).toFixed(1))
          : 0,
      color: PALETTE[index % PALETTE.length],
    }))

  const totalAmountFormatted = formatRupiah(totalAmount)

  const sortedData = [...distribution].sort((a, b) => b.amount - a.amount)
  const top3 = sortedData.slice(0, 3)
  const others = sortedData.slice(3)

  const otherAmount = others.reduce((acc, curr) => acc + curr.amount, 0)
  const otherPercentage = others.reduce((acc, curr) => acc + curr.percentage, 0)

  const otherItem: WalletDistributionData = {
    name: "Lainnya",
    amount: otherAmount,
    formattedAmount: formatRupiah(otherAmount),
    percentage: parseFloat(otherPercentage.toFixed(1)),
    color: OTHER_COLOR,
  }

  const chartData = others.length > 0 ? [...top3, otherItem] : top3

  return (
    <div className="flex h-full w-full flex-col justify-between gap-4 rounded-xs border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <div className="w-0.5 self-stretch bg-primary" />
          <h3 className="heading-sm font-mono tracking-tight text-card-foreground sm:heading-md">
            Penyebaran Uang per Dompet
          </h3>
        </div>
        <p className="pl-2.5 font-mono text-xs text-muted-foreground">
          Distribusi total saldo dana bersih yang tersebar di setiap dompet.
        </p>
      </div>

      {chartData.length === 0 ? (
        <EmptyChartState message="Belum ada wallet dengan saldo untuk ditampilkan." />
      ) : (
        <>
          <div className="relative my-2 flex h-[180px] min-h-[180px] w-full items-center justify-center">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={180}
            >
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="amount"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ zIndex: 50 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as WalletDistributionData
                      if (data.name === "Lainnya" && others.length > 0) {
                        return (
                          <div className="z-50 rounded-xs border border-border bg-popover px-3 py-2 font-mono text-xs text-popover-foreground shadow-xl">
                            <p className="mb-1 border-b border-border/50 pb-1 font-semibold text-foreground">
                              Rincian Lainnya ({others.length} Dompet):
                            </p>
                            <div className="flex flex-col gap-1">
                              {others.map((item) => (
                                <div
                                  key={item.name}
                                  className="flex items-center justify-between gap-4"
                                >
                                  <span className="text-muted-foreground">
                                    {item.name}
                                  </span>
                                  <span className="font-semibold text-emerald-600 num-financial dark:text-emerald-400">
                                    {item.formattedAmount} (
                                    {item.percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div className="rounded-xs border border-border bg-popover px-3 py-1.5 font-mono text-xs text-popover-foreground shadow-md">
                          <p className="text-muted-foreground">{data.name}</p>
                          <p className="font-semibold text-emerald-600 num-financial dark:text-emerald-400">
                            {data.formattedAmount} ({data.percentage}%)
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute z-0 flex flex-col items-center justify-center text-center">
              <span className="caption-sm text-[10px] tracking-wider text-muted-foreground uppercase">
                TOTAL SALDO
              </span>
              <span className="body-md font-mono font-bold text-card-foreground">
                {totalAmountFormatted}
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2">
            {chartData.map((item) => {
              const isOther = item.name === "Lainnya"

              return (
                <div key={item.name} className="group relative">
                  <div className="flex cursor-default items-center justify-between rounded-xs border border-border/40 bg-muted/50 px-3 py-2 font-mono text-xs transition-colors hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="flex items-center gap-1 font-medium text-muted-foreground">
                        {item.name}
                        {isOther && (
                          <span className="py-0.2 rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground">
                            ({others.length})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-card-foreground num-financial">
                        {item.formattedAmount}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {isOther && others.length > 0 && (
                    <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden min-w-[220px] flex-col gap-1.5 rounded-xs border border-border bg-popover p-3 font-mono text-xs text-popover-foreground shadow-xl transition-all duration-200 group-hover:flex">
                      <div className="border-b border-border/50 pb-1 text-[11px] font-semibold tracking-wider text-foreground text-muted-foreground uppercase">
                        Rincian Kategori Lainnya:
                      </div>
                      {others.map((subItem) => (
                        <div
                          key={subItem.name}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{ backgroundColor: subItem.color }}
                            />
                            <span className="text-muted-foreground">
                              {subItem.name}
                            </span>
                          </div>
                          <span className="font-semibold text-emerald-600 num-financial dark:text-emerald-400">
                            {subItem.formattedAmount} (
                            {subItem.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// --- PERFORMANCE CHART CARD ---
export function PerformanceChartCard({
  history,
  isLoading,
  isError,
}: HistoryChartProps) {
  const last = history?.points[history.points.length - 1]
  const returnAmount = last ? last.investment_value - last.invested_capital : 0
  const returnPercent =
    last && last.invested_capital > 0
      ? (returnAmount / last.invested_capital) * 100
      : null
  const hasPortfolio = !!history?.points.some(
    (point) => point.invested_capital > 0 || point.investment_value > 0
  )

  return (
    <div className="flex h-full w-full flex-col justify-between gap-4 rounded-xs border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <div className="w-0.5 self-stretch bg-primary" />
          <h3 className="caption-sm font-mono font-bold tracking-wider text-card-foreground uppercase sm:body-md">
            PERFORMANCE VS WAKTU
          </h3>
          {!isLoading && !isError && hasPortfolio && (
            <span
              className={`ml-auto font-mono text-xs font-semibold num-financial ${changeTone(returnAmount)}`}
            >
              {formatSigned(returnAmount)}
              {formatPercent(returnPercent)}
            </span>
          )}
        </div>
        <p className="pl-2.5 font-mono text-xs text-muted-foreground">
          Perbandingan akumulasi modal dasar dan nilai pasar portofolio
          investasi pada periode yang dipilih.
        </p>
      </div>

      {isLoading || isError || hasPortfolio ? (
        <>
          <HistoryChartFrame
            history={history}
            isLoading={isLoading}
            isError={isError}
            emptyMessage="Belum ada investasi pada periode ini."
          >
            {({ points, granularity }) => (
              <ComposedChart
                data={points}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient
                    id="portfolio-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={PORTFOLIO_COLOR}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={PORTFOLIO_COLOR}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date: string) =>
                    formatAxisDate(date, granularity)
                  }
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={(value: number) => formatCompactNumber(value)}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={Y_AXIS_WIDTH}
                />
                <Tooltip
                  wrapperStyle={{ zIndex: 50 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const point = payload[0].payload as DashboardHistoryPoint
                    const pointReturn =
                      point.investment_value - point.invested_capital
                    return (
                      <HistoryTooltipFrame point={point}>
                        <HistoryTooltipRow
                          label="Nilai Portofolio"
                          value={formatRupiah(point.investment_value)}
                        />
                        <HistoryTooltipRow
                          label="Modal Dasar"
                          value={formatRupiah(point.invested_capital)}
                        />
                        <HistoryTooltipRow
                          label="Imbal Hasil"
                          value={formatSigned(pointReturn)}
                          valueClassName={changeTone(pointReturn)}
                        />
                      </HistoryTooltipFrame>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="investment_value"
                  stroke={PORTFOLIO_COLOR}
                  strokeWidth={2}
                  fill="url(#portfolio-fill)"
                  dot={points.length < 3}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Line
                  type="stepAfter"
                  dataKey="invested_capital"
                  stroke={CAPITAL_COLOR}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={points.length < 3}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            )}
          </HistoryChartFrame>

          <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-xs"
                style={{ backgroundColor: PORTFOLIO_COLOR }}
              />
              Nilai Portofolio
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 border-t-2 border-dashed"
                style={{ borderColor: CAPITAL_COLOR }}
              />
              Modal Dasar
            </span>
          </div>
        </>
      ) : (
        <EmptyChartState message="Belum ada investasi pada periode ini." />
      )}
    </div>
  )
}

// --- CATEGORY ALLOCATION CARD ---
export interface CategoryAllocationData {
  name: string
  percentage: number
  color: string
}

interface CategoryAllocationCardProps {
  items: { name: string; percentage: number }[]
}

export function CategoryAllocationCard({ items }: CategoryAllocationCardProps) {
  const categories: CategoryAllocationData[] = items.map((item, index) => ({
    name: item.name,
    percentage: item.percentage,
    color: PALETTE[index % PALETTE.length],
  }))

  const sortedCategories = [...categories].sort(
    (a, b) => b.percentage - a.percentage
  )
  const top3 = sortedCategories.slice(0, 3)
  const others = sortedCategories.slice(3)

  const otherPercentage = parseFloat(
    others.reduce((acc, curr) => acc + curr.percentage, 0).toFixed(1)
  )

  const otherItem: CategoryAllocationData = {
    name: "Lainnya",
    percentage: otherPercentage,
    color: OTHER_COLOR,
  }

  const chartData = others.length > 0 ? [...top3, otherItem] : top3

  return (
    <div className="flex h-full w-full flex-col justify-between gap-4 rounded-xs border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex flex-row items-center justify-center gap-2 sm:justify-start">
        <div className="w-0.5 self-stretch bg-primary" />
        <h3 className="text-center caption-sm font-mono font-bold tracking-wider text-card-foreground uppercase sm:text-left sm:body-md">
          ALLOCATION PER JENIS
        </h3>
      </div>

      {chartData.length === 0 ? (
        <EmptyChartState message="Belum ada investasi untuk ditampilkan." />
      ) : (
        <>
          <div className="relative my-1 flex h-[150px] min-h-[150px] w-full items-center justify-center">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={150}
            >
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="percentage"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cat-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ zIndex: 50 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as CategoryAllocationData
                      if (data.name === "Lainnya" && others.length > 0) {
                        return (
                          <div className="z-50 rounded-xs border border-border bg-popover px-3 py-2 font-mono text-xs text-popover-foreground shadow-xl">
                            <p className="mb-1 border-b border-border/50 pb-1 font-semibold text-foreground">
                              Rincian Lainnya ({others.length} Kategori):
                            </p>
                            <div className="flex flex-col gap-1">
                              {others.map((item) => (
                                <div
                                  key={item.name}
                                  className="flex items-center justify-between gap-4"
                                >
                                  <span className="text-muted-foreground">
                                    {item.name}
                                  </span>
                                  <span className="font-semibold text-emerald-600 num-financial dark:text-emerald-400">
                                    {item.percentage}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div className="rounded-xs border border-border bg-popover px-3 py-1.5 font-mono text-xs text-popover-foreground shadow-md">
                          <p className="text-muted-foreground">{data.name}</p>
                          <p className="font-semibold text-emerald-600 num-financial dark:text-emerald-400">
                            {data.percentage}%
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute z-0 flex flex-col items-center justify-center text-center">
              <span className="caption-sm text-[10px] text-muted-foreground">
                Active
              </span>
              <span className="body-md font-mono leading-tight font-bold text-card-foreground">
                {categories.length} Categories
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-1.5 font-mono text-xs">
            {chartData.map((cat) => {
              const isOther = cat.name === "Lainnya"

              return (
                <div key={cat.name} className="group relative">
                  <div className="flex cursor-default items-center justify-between rounded-xs px-1 py-0.5 transition-colors hover:bg-muted/60">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex items-center gap-1 text-muted-foreground">
                        {cat.name}
                        {isOther && (
                          <span className="py-0.2 rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground">
                            ({others.length})
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-semibold text-card-foreground num-financial">
                      {cat.percentage}%
                    </span>
                  </div>

                  {isOther && others.length > 0 && (
                    <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden min-w-[180px] flex-col gap-1 rounded-xs border border-border bg-popover p-2.5 font-mono text-xs text-popover-foreground shadow-xl transition-all duration-200 group-hover:flex">
                      <div className="border-b border-border/50 pb-1 text-[10px] font-semibold tracking-wider text-foreground text-muted-foreground uppercase">
                        Rincian Kategori Lainnya:
                      </div>
                      {others.map((subCat) => (
                        <div
                          key={subCat.name}
                          className="flex items-center justify-between gap-3 py-0.5 text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block size-2 rounded-full"
                              style={{ backgroundColor: subCat.color }}
                            />
                            <span className="text-muted-foreground">
                              {subCat.name}
                            </span>
                          </div>
                          <span className="font-semibold text-emerald-600 num-financial dark:text-emerald-400">
                            {subCat.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
