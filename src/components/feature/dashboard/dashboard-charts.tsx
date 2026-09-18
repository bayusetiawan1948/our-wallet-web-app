import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { ChartLineUpIcon } from "@phosphor-icons/react";
import { formatRupiah } from "@/libs/number";

const PALETTE = ["#059669", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];
const OTHER_COLOR = "#64748b";

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-[220px] w-full flex flex-1 min-h-[220px] flex-col items-center justify-center gap-2 text-center">
      <ChartLineUpIcon className="size-6 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground font-mono max-w-[240px]">{message}</p>
    </div>
  );
}

// --- NET WORTH TREND CARD ---
export function NetWorthTrendCard() {
  return (
    <div className="w-full h-full bg-card border border-border rounded-xs flex flex-col p-4 sm:p-5 gap-4 justify-between shadow-xs">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <div className="w-0.5 self-stretch bg-primary" />
          <h3 className="heading-sm sm:heading-md font-mono tracking-tight text-card-foreground">Net Worth Trend</h3>
        </div>
        <p className="text-xs text-muted-foreground font-mono pl-2.5">
          Tren pertumbuhan nilai bersih (aset bersih) seluruh dompet dari bulan ke bulan.
        </p>
      </div>

      <EmptyChartState message="Data historis net worth belum tersedia. Grafik akan muncul setelah backend menyediakan data time-series." />
    </div>
  );
}

// --- WALLET DISTRIBUTION (PENYEBARAN UANG PER DOMPET) CARD ---
export interface WalletDistributionData {
  name: string;
  amount: number;
  formattedAmount: string;
  percentage: number;
  color: string;
}

interface WalletSplitCardProps {
  wallets: { id: string; name: string; balance: number }[];
}

export function WalletSplitCard({ wallets }: WalletSplitCardProps) {
  const totalAmount = wallets.reduce((sum, w) => sum + w.balance, 0);

  const distribution: WalletDistributionData[] = wallets
    .filter((w) => w.balance > 0)
    .map((w, index) => ({
      name: w.name,
      amount: w.balance,
      formattedAmount: formatRupiah(w.balance),
      percentage: totalAmount > 0 ? parseFloat(((w.balance / totalAmount) * 100).toFixed(1)) : 0,
      color: PALETTE[index % PALETTE.length],
    }));

  const totalAmountFormatted = formatRupiah(totalAmount);

  const sortedData = [...distribution].sort((a, b) => b.amount - a.amount);
  const top3 = sortedData.slice(0, 3);
  const others = sortedData.slice(3);

  const otherAmount = others.reduce((acc, curr) => acc + curr.amount, 0);
  const otherPercentage = others.reduce((acc, curr) => acc + curr.percentage, 0);

  const otherItem: WalletDistributionData = {
    name: "Lainnya",
    amount: otherAmount,
    formattedAmount: formatRupiah(otherAmount),
    percentage: parseFloat(otherPercentage.toFixed(1)),
    color: OTHER_COLOR,
  };

  const chartData = others.length > 0 ? [...top3, otherItem] : top3;

  return (
    <div className="w-full h-full bg-card border border-border rounded-xs flex flex-col p-4 sm:p-5 gap-4 justify-between shadow-xs">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <div className="w-0.5 self-stretch bg-primary" />
          <h3 className="heading-sm sm:heading-md font-mono tracking-tight text-card-foreground">Penyebaran Uang per Dompet</h3>
        </div>
        <p className="text-xs text-muted-foreground font-mono pl-2.5">
          Distribusi total saldo dana bersih yang tersebar di setiap dompet.
        </p>
      </div>

      {chartData.length === 0 ? (
        <EmptyChartState message="Belum ada wallet dengan saldo untuk ditampilkan." />
      ) : (
        <>
          <div className="relative h-[180px] w-full flex items-center justify-center my-2 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
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
                      const data = payload[0].payload as WalletDistributionData;
                      if (data.name === "Lainnya" && others.length > 0) {
                        return (
                          <div className="bg-popover text-popover-foreground border border-border px-3 py-2 rounded-xs text-xs font-mono shadow-xl z-50">
                            <p className="font-semibold text-foreground mb-1 border-b border-border/50 pb-1">
                              Rincian Lainnya ({others.length} Dompet):
                            </p>
                            <div className="flex flex-col gap-1">
                              {others.map((item) => (
                                <div key={item.name} className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">{item.name}</span>
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 num-financial">
                                    {item.formattedAmount} ({item.percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="bg-popover text-popover-foreground border border-border px-3 py-1.5 rounded-xs text-xs font-mono shadow-md">
                          <p className="text-muted-foreground">{data.name}</p>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400 num-financial">
                            {data.formattedAmount} ({data.percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none z-0">
              <span className="caption-sm text-muted-foreground uppercase text-[10px] tracking-wider">TOTAL SALDO</span>
              <span className="body-md font-bold font-mono text-card-foreground">{totalAmountFormatted}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            {chartData.map((item) => {
              const isOther = item.name === "Lainnya";

              return (
                <div key={item.name} className="relative group">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-xs text-xs font-mono transition-colors hover:bg-muted cursor-default border border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-xs inline-block" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground font-medium flex items-center gap-1">
                        {item.name}
                        {isOther && (
                          <span className="text-[10px] bg-muted px-1 py-0.2 rounded text-muted-foreground border border-border">
                            ({others.length})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-card-foreground num-financial">{item.formattedAmount}</span>
                      <span className="text-muted-foreground text-[11px]">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {isOther && others.length > 0 && (
                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover:flex flex-col gap-1.5 bg-popover text-popover-foreground border border-border p-3 rounded-xs text-xs font-mono shadow-xl z-50 min-w-[220px] pointer-events-none transition-all duration-200">
                      <div className="font-semibold text-foreground border-b border-border/50 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                        Rincian Kategori Lainnya:
                      </div>
                      {others.map((subItem) => (
                        <div key={subItem.name} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full inline-block" style={{ backgroundColor: subItem.color }} />
                            <span className="text-muted-foreground">{subItem.name}</span>
                          </div>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 num-financial">
                            {subItem.formattedAmount} ({subItem.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// --- PERFORMANCE CHART CARD ---
export function PerformanceChartCard() {
  return (
    <div className="w-full h-full bg-card border border-border rounded-xs flex flex-col p-4 sm:p-5 gap-4 justify-between shadow-xs">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <div className="w-0.5 self-stretch bg-primary" />
          <h3 className="caption-sm sm:body-md font-mono font-bold uppercase tracking-wider text-card-foreground">
            PERFORMANCE VS WAKTU
          </h3>
        </div>
        <p className="text-xs text-muted-foreground font-mono pl-2.5">
          Perbandingan akumulasi modal dasar dan total pertumbuhan portofolio secara bulanan.
        </p>
      </div>

      <EmptyChartState message="Data historis performa portofolio belum tersedia. Grafik akan muncul setelah backend menyediakan data time-series." />
    </div>
  );
}

// --- CATEGORY ALLOCATION CARD ---
export interface CategoryAllocationData {
  name: string;
  percentage: number;
  color: string;
}

interface CategoryAllocationCardProps {
  items: { name: string; percentage: number }[];
}

export function CategoryAllocationCard({ items }: CategoryAllocationCardProps) {
  const categories: CategoryAllocationData[] = items.map((item, index) => ({
    name: item.name,
    percentage: item.percentage,
    color: PALETTE[index % PALETTE.length],
  }));

  const sortedCategories = [...categories].sort((a, b) => b.percentage - a.percentage);
  const top3 = sortedCategories.slice(0, 3);
  const others = sortedCategories.slice(3);

  const otherPercentage = parseFloat(others.reduce((acc, curr) => acc + curr.percentage, 0).toFixed(1));

  const otherItem: CategoryAllocationData = {
    name: "Lainnya",
    percentage: otherPercentage,
    color: OTHER_COLOR,
  };

  const chartData = others.length > 0 ? [...top3, otherItem] : top3;

  return (
    <div className="w-full h-full bg-card border border-border rounded-xs flex flex-col p-4 sm:p-5 gap-4 justify-between shadow-xs">
      <div className="flex flex-row items-center justify-center sm:justify-start gap-2">
        <div className="w-0.5 self-stretch bg-primary" />
        <h3 className="caption-sm sm:body-md font-mono font-bold uppercase tracking-wider text-center sm:text-left text-card-foreground">
          ALLOCATION PER JENIS
        </h3>
      </div>

      {chartData.length === 0 ? (
        <EmptyChartState message="Belum ada investasi untuk ditampilkan." />
      ) : (
        <>
          <div className="relative h-[150px] w-full flex items-center justify-center my-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
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
                      const data = payload[0].payload as CategoryAllocationData;
                      if (data.name === "Lainnya" && others.length > 0) {
                        return (
                          <div className="bg-popover text-popover-foreground border border-border px-3 py-2 rounded-xs text-xs font-mono shadow-xl z-50">
                            <p className="font-semibold text-foreground mb-1 border-b border-border/50 pb-1">
                              Rincian Lainnya ({others.length} Kategori):
                            </p>
                            <div className="flex flex-col gap-1">
                              {others.map((item) => (
                                <div key={item.name} className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">{item.name}</span>
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 num-financial">
                                    {item.percentage}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="bg-popover text-popover-foreground border border-border px-3 py-1.5 rounded-xs text-xs font-mono shadow-md">
                          <p className="text-muted-foreground">{data.name}</p>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400 num-financial">{data.percentage}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none z-0">
              <span className="caption-sm text-muted-foreground text-[10px]">Active</span>
              <span className="body-md font-bold font-mono text-card-foreground leading-tight">
                {categories.length} Categories
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full font-mono text-xs">
            {chartData.map((cat) => {
              const isOther = cat.name === "Lainnya";

              return (
                <div key={cat.name} className="relative group">
                  <div className="flex items-center justify-between py-0.5 px-1 rounded-xs transition-colors hover:bg-muted/60 cursor-default">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                      <span className="text-muted-foreground flex items-center gap-1">
                        {cat.name}
                        {isOther && (
                          <span className="text-[10px] bg-muted px-1 py-0.2 rounded text-muted-foreground border border-border">
                            ({others.length})
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-semibold text-card-foreground num-financial">{cat.percentage}%</span>
                  </div>

                  {isOther && others.length > 0 && (
                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover:flex flex-col gap-1 bg-popover text-popover-foreground border border-border p-2.5 rounded-xs text-xs font-mono shadow-xl z-50 min-w-[180px] pointer-events-none transition-all duration-200">
                      <div className="font-semibold text-foreground border-b border-border/50 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        Rincian Kategori Lainnya:
                      </div>
                      {others.map((subCat) => (
                        <div key={subCat.name} className="flex items-center justify-between gap-3 text-xs py-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full inline-block" style={{ backgroundColor: subCat.color }} />
                            <span className="text-muted-foreground">{subCat.name}</span>
                          </div>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 num-financial">{subCat.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
