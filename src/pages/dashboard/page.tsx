import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useQuery, useQueries } from "@tanstack/react-query";
import { subDays, subMonths, subYears, startOfDay, format } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { listWallets } from "@/services/wallets.service";
import { listInvestments, listTransactions as listInvestmentTransactions } from "@/services/investments.service";
import { listDebts, listPayments as listDebtPayments } from "@/services/debts.service";
import { listTransactions } from "@/services/transactions.service";
import {
  InvestmentMarquee,
  CurrencySelector,
  DateFilterPopover,
  WalletSelector,
  CardDashboard,
  NetWorthTrendCard,
  WalletSplitCard,
  PerformanceChartCard,
  CategoryAllocationCard,
  type DatePresetKey,
  type DashboardSummaryCard,
  type InvestmentItem,
} from "@/components/feature/dashboard";
import { formatRupiah } from "@/libs/number";
import { WalletIcon, MoneyIcon, CreditCardIcon, ChartLineUpIcon } from "@phosphor-icons/react";

const ASSET_TYPE_LABELS: Record<string, string> = {
  saham: "Saham",
  reksadana: "Reksadana",
  crypto: "Crypto",
  emas: "Emas",
  perak: "Perak",
  obligasi: "Obligasi",
  lainnya: "Lainnya",
};

function getDateRangeParams(
  datePreset: DatePresetKey,
  customRange: DateRange | undefined
): { from?: string; to?: string } {
  const today = new Date();

  if (datePreset === "custom") {
    if (!customRange?.from) return {};
    return {
      from: format(customRange.from, "yyyy-MM-dd"),
      to: format(customRange.to ?? today, "yyyy-MM-dd"),
    };
  }

  const from = {
    "1d": startOfDay(today),
    "7d": subDays(today, 7),
    "30d": subDays(today, 30),
    "3m": subMonths(today, 3),
    "6m": subMonths(today, 6),
    "1y": subYears(today, 1),
  }[datePreset];

  return { from: format(from, "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
}

export default function Page() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [currency, setCurrency] = useState<string>("IDR");
  const [datePreset, setDatePreset] = useState<DatePresetKey>("30d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>([]);

  const { data: wallets = [] } = useQuery({ queryKey: ["wallets"], queryFn: listWallets });
  const { data: investments = [] } = useQuery({ queryKey: ["investments"], queryFn: listInvestments });
  const { data: debts = [] } = useQuery({ queryKey: ["debts"], queryFn: listDebts });

  const dateRange = getDateRangeParams(datePreset, customRange);
  const { data: periodTransactions = [] } = useQuery({
    queryKey: ["transactions", dateRange],
    queryFn: () => listTransactions(dateRange),
  });

  const investmentTxQueries = useQueries({
    queries: investments.map((inv) => ({
      queryKey: ["investment-transactions", inv.id],
      queryFn: () => listInvestmentTransactions(inv.id),
    })),
  });

  const activeUtangDebts = debts.filter((d) => d.type === "utang" && d.status !== "paid" && d.status !== "cancelled");
  const debtPaymentQueries = useQueries({
    queries: activeUtangDebts.map((debt) => ({
      queryKey: ["debt-payments", debt.id],
      queryFn: () => listDebtPayments(debt.id),
    })),
  });

  const accessibleWallets = useMemo(
    () => wallets.map((w) => ({ id: w.id, name: w.name.toUpperCase(), balance: w.balance })),
    [wallets]
  );

  const walletIds = useMemo(() => accessibleWallets.map((w) => w.id), [accessibleWallets]);
  const effectiveSelectedIds = selectedWalletIds.length > 0 ? selectedWalletIds : walletIds;

  const toggleWallet = (id: string) => {
    setSelectedWalletIds((prev) => {
      const base = prev.length > 0 ? prev : walletIds;
      if (base.includes(id)) {
        if (base.length === 1) return base;
        return base.filter((item) => item !== id);
      }
      return [...base, id];
    });
  };

  const totalWalletBalance = accessibleWallets
    .filter((w) => effectiveSelectedIds.includes(w.id))
    .reduce((sum, w) => sum + w.balance, 0);

  const totalInvestmentValue = investments.reduce(
    (sum, inv) => sum + inv.quantity_held * (inv.latest_price_per_unit ?? 0),
    0
  );

  const totalAssets = totalWalletBalance + totalInvestmentValue;

  const totalLiabilities = activeUtangDebts.reduce((sum, debt, index) => {
    const payments = debtPaymentQueries[index]?.data ?? [];
    const paid = payments.filter((p) => p.status === "active").reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(debt.principal - paid, 0);
  }, 0);

  const netWorth = totalAssets - totalLiabilities;

  const periodIncome = periodTransactions
    .filter((t) => t.status === "active" && t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const periodExpense = periodTransactions
    .filter((t) => t.status === "active" && t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const savingsRate = periodIncome > 0 ? ((periodIncome - periodExpense) / periodIncome) * 100 : null;

  const summaryCards: DashboardSummaryCard[] = [
    {
      id: "net-worth",
      title: "NET WORTH",
      value: formatRupiah(netWorth),
      icon: WalletIcon,
    },
    {
      id: "total-assets",
      title: "TOTAL ASSETS",
      value: formatRupiah(totalAssets),
      icon: MoneyIcon,
    },
    {
      id: "liabilities",
      title: "LIABILITIES",
      value: formatRupiah(totalLiabilities),
      icon: CreditCardIcon,
    },
    {
      id: "savings-rate",
      title: "SAVINGS RATE",
      value: savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "-",
      icon: ChartLineUpIcon,
    },
  ];

  const investmentItems: InvestmentItem[] = investments.map((inv, index) => {
    const txs = investmentTxQueries[index]?.data ?? [];
    const activeTxs = txs.filter((tx) => tx.status === "active");
    const costBasis = activeTxs.reduce(
      (sum, tx) => sum + (tx.type === "buy" ? tx.quantity * tx.price : -tx.quantity * tx.price),
      0
    );
    const marketValue = inv.quantity_held * (inv.latest_price_per_unit ?? 0);
    const unrealizedPl = marketValue - costBasis;
    const unrealizedPlPercent = costBasis > 0 ? (unrealizedPl / costBasis) * 100 : 0;

    return {
      symbol: inv.asset_name,
      name: inv.asset_name,
      type: ASSET_TYPE_LABELS[inv.asset_type] ?? inv.asset_type,
      badge: inv.asset_name.slice(0, 2).toUpperCase(),
      costBasis,
      marketValue,
      unrealizedPl,
      unrealizedPlPercent,
    };
  });

  const categoryAllocation = useMemo(() => {
    const totals = new Map<string, number>();
    investments.forEach((inv) => {
      const value = inv.quantity_held * (inv.latest_price_per_unit ?? 0);
      const label = ASSET_TYPE_LABELS[inv.asset_type] ?? inv.asset_type;
      totals.set(label, (totals.get(label) ?? 0) + value);
    });
    const total = Array.from(totals.values()).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    return Array.from(totals.entries()).map(([name, value]) => ({
      name,
      percentage: parseFloat(((value / total) * 100).toFixed(1)),
    }));
  }, [investments]);

  return (
    <div className="flex w-full flex-1 flex-col gap-4 py-8 sm:px-8 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 sm:p-0">
        <div className="flex flex-col items-start gap-2 mb-1">
          <h1 className="body-lg sm:heading-md md:heading-xl">Financial Dashboard</h1>
          <p className="caption-sm">
            {isAdmin
              ? "Menampilkan keseluruhan saldo wallet, investasi, dan net worth seluruh keluarga."
              : "Menampilkan saldo wallet terotorisasi & bagian porsi aset milik Anda."}
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-3 sm:flex-nowrap sm:w-auto">
          <CurrencySelector value={currency} onChange={setCurrency} />
          <DateFilterPopover
            datePreset={datePreset}
            onDatePresetChange={setDatePreset}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
          <WalletSelector
            wallets={accessibleWallets}
            selectedWalletIds={effectiveSelectedIds}
            onToggleWallet={toggleWallet}
          />
        </div>
      </div>

      <div className="w-full min-w-0">
        <InvestmentMarquee items={investmentItems} />
      </div>

      <div className="px-6 sm:p-0 w-full min-w-0 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <CardDashboard key={card.id} card={card} />
        ))}
      </div>

      <div className="px-6 sm:p-0 w-full min-w-0 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NetWorthTrendCard />
        </div>
        <div className="xl:col-span-1">
          <WalletSplitCard wallets={accessibleWallets} />
        </div>
      </div>

      <div className="px-6 sm:p-0 w-full min-w-0 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PerformanceChartCard />
        </div>
        <div className="xl:col-span-1">
          <CategoryAllocationCard items={categoryAllocation} />
        </div>
      </div>
    </div>
  );
}
