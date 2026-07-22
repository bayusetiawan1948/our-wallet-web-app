import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { useMockStore } from "@/lib/mock-store";
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
} from "@/components/feature/dashboard";
import { Badge } from "@/components/ui/badge";
import { ShieldCheckIcon, UserIcon, WalletIcon, MoneyIcon, CreditCardIcon, ChartLineUpIcon } from "@phosphor-icons/react";

export default function Page() {
  const store = useMockStore();
  const isAdmin = store.activeRole === "admin";
  const activeUser = store.getActiveUser();
  const accessibleWallets = store.getAccessibleWallets();

  const [currency, setCurrency] = useState<string>("IDR");
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>(
    accessibleWallets.map((w) => w.id)
  );
  const [datePreset, setDatePreset] = useState<DatePresetKey>("30d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  const toggleWallet = (id: string) => {
    setSelectedWalletIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Dynamic calculations based on active role & store
  const totalWalletBalance = accessibleWallets.reduce((sum, w) => sum + w.balance, 0);

  // Portfolio value
  let totalInvestmentValue = 0;
  store.investments.forEach((inv) => {
    const activeTxs = store.investmentTransactions.filter(
      (itx) => itx.investment_id === inv.id && itx.status === "active"
    );
    let qty = 0;
    activeTxs.forEach((tx) => (qty += tx.type === "buy" ? tx.quantity : -tx.quantity));

    const val = store.valuations.find((v) => v.investment_id === inv.id);
    if (val) totalInvestmentValue += qty * val.price_per_unit;
  });

  const totalAssets = totalWalletBalance + (isAdmin ? totalInvestmentValue : totalInvestmentValue * 0.4);

  // Debts
  let totalLiabilities = 0;
  store.debts.forEach((debt) => {
    if (debt.type === "utang" && debt.status !== "lunas") {
      const paid = store.debtPayments
        .filter((p) => p.debt_id === debt.id && p.status === "active")
        .reduce((sum, p) => sum + p.amount, 0);

      const remaining = debt.principal - paid;
      if (isAdmin) {
        totalLiabilities += remaining;
      } else {
        totalLiabilities += Math.round(remaining * (debt.portion_member / debt.principal));
      }
    }
  });

  const netWorth = totalAssets - totalLiabilities;

  const dynamicSummaryCards: DashboardSummaryCard[] = [
    {
      id: "net-worth",
      title: "NET WORTH",
      value: `Rp ${netWorth.toLocaleString("id-ID")}`,
      trend: "+12.4% vs month",
      isPositive: true,
      icon: WalletIcon,
    },
    {
      id: "total-assets",
      title: "TOTAL ASSETS",
      value: `Rp ${totalAssets.toLocaleString("id-ID")}`,
      trend: "+8.2% vs month",
      isPositive: true,
      icon: MoneyIcon,
    },
    {
      id: "liabilities",
      title: "LIABILITIES",
      value: `Rp ${totalLiabilities.toLocaleString("id-ID")}`,
      trend: "-4.5% vs month",
      isPositive: true,
      icon: CreditCardIcon,
    },
    {
      id: "savings-rate",
      title: "SAVINGS RATE",
      value: "42.5%",
      trend: "+1.5% vs month",
      isPositive: true,
      icon: ChartLineUpIcon,
    },
  ];

  return (
    <div className="flex w-full flex-1 flex-col gap-4 py-8 sm:px-8 sm:py-6">
      {/* Dynamic Role Banner */}
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
            selectedWalletIds={selectedWalletIds}
            onToggleWallet={toggleWallet}
          />
        </div>
      </div>

      <div className="w-full min-w-0">
        <InvestmentMarquee />
      </div>

      <div className="px-6 sm:p-0 w-full min-w-0 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dynamicSummaryCards.map((card) => (
          <CardDashboard key={card.id} card={card} />
        ))}
      </div>

      <div className="px-6 sm:p-0 w-full min-w-0 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NetWorthTrendCard />
        </div>
        <div className="xl:col-span-1">
          <WalletSplitCard />
        </div>
      </div>

      <div className="px-6 sm:p-0 w-full min-w-0 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PerformanceChartCard />
        </div>
        <div className="xl:col-span-1">
          <CategoryAllocationCard />
        </div>
      </div>
    </div>
  );
}
