import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import * as investmentsService from "@/services/investments.service";
import type { InvestmentWithValuation } from "@/services/investments.service";
import * as walletsService from "@/services/wallets.service";
import { useDataControls, type FilterConfig } from "@/hooks/use-data-controls";
import { DataTableToolbar } from "@/components/common/data-table-toolbar";
import { DataPagination } from "@/components/common/data-table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { CardGridSkeleton, DataTableSkeleton } from "@/components/common/loading-skeleton";
import { ErrorState } from "@/components/common/error-state";
import {
  ChartLineUpIcon,
  PlusIcon,
  PencilSimpleIcon,
  TrendUpIcon,
  TrendDownIcon,
  CoinsIcon,
  BankIcon,
  ArrowsLeftRightIcon,
  SparkleIcon,
  ScalesIcon,
  WalletIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatRupiah } from "@/libs/number";
import { Button } from "@/components/ui/button";
import { type AssetType, type InvestmentTransaction, type Wallet } from "@/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function InvestmentPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [investments, setInvestments] = useState<InvestmentWithValuation[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accessibleWallets = wallets;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [investmentList, walletList] = await Promise.all([
        investmentsService.listInvestments(),
        walletsService.listWallets(),
      ]);
      setInvestments(investmentList);
      setWallets(walletList);
      const txLists = await Promise.all(
        investmentList.map((inv) => investmentsService.listTransactions(inv.id))
      );
      setTransactions(txLists.flat());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add New Investment Modal State
  const [isAddInvOpen, setIsAddInvOpen] = useState(false);
  const [newInvName, setNewInvName] = useState("");
  const [newInvType, setNewInvType] = useState<AssetType>("saham");
  const [newInvUnit, setNewInvUnit] = useState("lot");
  const [newInvInitialPrice, setNewInvInitialPrice] = useState("");
  const [newInvOwnerType, setNewInvOwnerType] = useState<"household" | "user">("household");

  // Valuation Modal State
  const [selectedInvForVal, setSelectedInvForVal] = useState<string | null>(null);
  const [newValuationPrice, setNewValuationPrice] = useState<string>("");

  // Buy/Sell Modal State
  const [selectedInvForTx, setSelectedInvForTx] = useState<string | null>(null);
  const [invTxType, setInvTxType] = useState<"buy" | "sell">("buy");
  const [invTxWalletId, setInvTxWalletId] = useState<string>(accessibleWallets[0]?.id || "");
  const [invTxQty, setInvTxQty] = useState<string>("");
  const [invTxPrice, setInvTxPrice] = useState<string>("");
  const [invTxDate, setInvTxDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim()) return;

    setIsSubmitting(true);
    try {
      await investmentsService.createInvestment({
        owner_type: newInvOwnerType === "household" ? "household" : "user",
        asset_name: newInvName,
        asset_type: newInvType,
        unit: newInvUnit,
        initial_price: parseFloat(newInvInitialPrice) || 0,
      });
      toast.success(`Aset investasi "${newInvName}" berhasil dibuat!`);
      setNewInvName("");
      setNewInvUnit("lot");
      setNewInvInitialPrice("");
      setIsAddInvOpen(false);
      loadData();
    } catch (err) {
      const description =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error("Gagal membuat aset investasi", { description });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvForVal || !newValuationPrice) return;
    try {
      await investmentsService.addValuation(selectedInvForVal, parseFloat(newValuationPrice) || 0);
      toast.success("Harga pasar berhasil diperbarui!");
      setNewValuationPrice("");
      setSelectedInvForVal(null);
      loadData();
    } catch {
      toast.error("Gagal memperbarui harga pasar.");
    }
  };

  const handleCreateInvTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvForTx || !invTxWalletId || !invTxQty || !invTxPrice) return;

    const qty = parseFloat(invTxQty) || 0;
    const price = parseFloat(invTxPrice) || 0;

    setIsSubmitting(true);
    try {
      await investmentsService.addTransaction(selectedInvForTx, {
        wallet_id: invTxWalletId,
        type: invTxType,
        quantity: qty,
        price,
        date: invTxDate,
      });
      toast.success("Transaksi investasi berhasil dicatat!");
      setInvTxQty("");
      setInvTxPrice("");
      setSelectedInvForTx(null);
      loadData();
    } catch (err) {
      const description =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error("Gagal mencatat transaksi investasi", { description });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Data Controls for Investment Assets Grid
  const invFilterConfigs = useMemo<FilterConfig<InvestmentWithValuation>[]>(() => {
    return [
      {
        id: "asset_type",
        label: "Kategori Aset",
        type: "select",
        options: [
          { label: "Saham", value: "saham" },
          { label: "Crypto", value: "crypto" },
          { label: "Emas / Logam Mulia", value: "emas" },
          { label: "Reksadana", value: "reksadana" },
          { label: "Obligasi / SBN", value: "obligasi" },
          { label: "Perak", value: "perak" },
          { label: "Lainnya", value: "lainnya" },
        ],
      },
    ];
  }, []);

  const invSortOptions = useMemo(() => {
    return [
      { label: "Nama Aset (A - Z)", rules: [{ field: "asset_name", order: "asc" as const }] },
      { label: "Nama Aset (Z - A)", rules: [{ field: "asset_name", order: "desc" as const }] },
    ];
  }, []);

  const [invSortIndex, setInvSortIndex] = useState(0);

  const invControls = useDataControls({
    data: investments,
    searchFields: ["asset_name", "asset_type"],
    initialSort: invSortOptions[0].rules,
    initialPageSize: 12,
  });

  // Calculate investment summaries from controls data
  const investmentSummaries = invControls.paginatedData.map((inv) => {
    const activeTxs = transactions.filter(
      (itx) => itx.investment_id === inv.id && itx.status === "active"
    );

    let currentQty = 0;
    let totalCost = 0;

    activeTxs.forEach((tx) => {
      if (tx.type === "buy") {
        currentQty += tx.quantity;
        totalCost += tx.quantity * tx.price;
      } else {
        currentQty -= tx.quantity;
        totalCost -= tx.quantity * tx.price;
      }
    });

    const unitPrice = inv.latest_price_per_unit ?? 0;
    const marketValue = currentQty * unitPrice;
    const returnAmount = marketValue - totalCost;
    const returnPct = totalCost > 0 ? (returnAmount / totalCost) * 100 : 0;
    const avgCostPerUnit = currentQty > 0 ? totalCost / currentQty : 0;

    return {
      inv,
      currentQty,
      totalCost,
      unitPrice,
      avgCostPerUnit,
      marketValue,
      returnAmount,
      returnPct,
    };
  });

  // All investment summaries for overall stats header
  const allInvestmentSummaries = useMemo(() => {
    return investments.map((inv) => {
      const activeTxs = transactions.filter(
        (itx) => itx.investment_id === inv.id && itx.status === "active"
      );

      let currentQty = 0;
      let totalCost = 0;

      activeTxs.forEach((tx) => {
        if (tx.type === "buy") {
          currentQty += tx.quantity;
          totalCost += tx.quantity * tx.price;
        } else {
          currentQty -= tx.quantity;
          totalCost -= tx.quantity * tx.price;
        }
      });

      const unitPrice = inv.latest_price_per_unit ?? 0;
      const marketValue = currentQty * unitPrice;

      return {
        marketValue,
        totalCost,
      };
    });
  }, [investments, transactions]);

  // Data Controls for Investment Transactions History
  const itxSortOptions = useMemo(() => {
    return [
      { label: "Tanggal Terbaru", rules: [{ field: "date", order: "desc" as const }] },
      { label: "Tanggal Terlama", rules: [{ field: "date", order: "asc" as const }] },
      { label: "Quantity Terbesar", rules: [{ field: "quantity", order: "desc" as const }] },
    ];
  }, []);

  const [itxSortIndex, setItxSortIndex] = useState(0);

  const itxControls = useDataControls({
    data: transactions,
    searchFields: ["date"],
    initialSort: itxSortOptions[0].rules,
    initialPageSize: 10,
  });

  const totalPortfolioMarketValue = allInvestmentSummaries.reduce((sum, s) => sum + s.marketValue, 0);
  const totalPortfolioCostBasis = allInvestmentSummaries.reduce((sum, s) => sum + s.totalCost, 0);
  const totalReturnAmount = totalPortfolioMarketValue - totalPortfolioCostBasis;
  const totalReturnPct = totalPortfolioCostBasis > 0 ? (totalReturnAmount / totalPortfolioCostBasis) * 100 : 0;

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case "emas":
      case "perak":
        return <CoinsIcon className="size-5 text-amber-500 shrink-0" />;
      case "crypto":
        return <TrendUpIcon className="size-5 text-purple-500 shrink-0" />;
      case "saham":
        return <ChartLineUpIcon className="size-5 text-blue-500 shrink-0" />;
      case "reksadana":
        return <BankIcon className="size-5 text-emerald-500 shrink-0" />;
      case "obligasi":
        return <ScalesIcon className="size-5 text-indigo-500 shrink-0" />;
      default:
        return <SparkleIcon className="size-5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-12 xl:pb-8">
      {/* Header Banner & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <ChartLineUpIcon className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <span className="truncate">Portofolio & Investasi</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Kelola aset keluarga (Saham, Emas, Crypto, Reksadana), pantau pergerakan harga pasar, dan catat histori transaksi.
          </p>
        </div>

        {/* Summary Metric & CTA */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-border/50 shrink-0">
          <div className="flex items-center gap-3 bg-muted/30 px-4 py-2.5 rounded-xl border border-border/50 min-w-0">
            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Total Portofolio
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-foreground truncate">
                {formatRupiah(totalPortfolioMarketValue)}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant={totalReturnAmount >= 0 ? "default" : "destructive"}
                  className={`text-[10px] font-mono px-1.5 py-0.5 gap-0.5 rounded-md whitespace-nowrap ${
                    totalReturnAmount >= 0
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  }`}
                >
                  {totalReturnAmount >= 0 ? <TrendUpIcon className="size-3 shrink-0" /> : <TrendDownIcon className="size-3 shrink-0" />}
                  {totalReturnAmount >= 0 ? "+" : ""}
                  {formatRupiah(totalReturnAmount)} ({totalReturnPct.toFixed(2)}%)
                </Badge>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">Return</span>
              </div>
            </div>
          </div>

          <Dialog open={isAddInvOpen} onOpenChange={setIsAddInvOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-primary text-primary-foreground font-medium gap-2 shadow-xs transition-all hover:shadow-md h-10 px-4 shrink-0">
                <PlusIcon className="w-4 h-4" />
                <span>Tambah Investasi Baru</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-2xl">
              <form onSubmit={handleCreateInvestment}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <ChartLineUpIcon className="size-5 text-primary" />
                    Tambah Aset Investasi Baru
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Daftarkan nama instrumen investasi baru untuk dipantau pergerakan harga dan riwayat kepemilikannya.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="inv-name" className="text-xs font-semibold">Nama Aset Investasi</Label>
                    <Input
                      id="inv-name"
                      placeholder="Contoh: BBCA, Bitcoin, Emas Antam, Sucor Equity"
                      value={newInvName}
                      onChange={(e) => setNewInvName(e.target.value)}
                      required
                      className="rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="inv-type" className="text-xs font-semibold">Kategori Aset</Label>
                      <Select value={newInvType} onValueChange={(v: AssetType) => setNewInvType(v)}>
                        <SelectTrigger id="inv-type" className="rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="saham">📈 Saham</SelectItem>
                          <SelectItem value="crypto">🪙 Crypto</SelectItem>
                          <SelectItem value="emas">🥇 Emas / Logam Mulia</SelectItem>
                          <SelectItem value="reksadana">🏦 Reksadana</SelectItem>
                          <SelectItem value="obligasi">📄 Obligasi / SBN</SelectItem>
                          <SelectItem value="perak">🥈 Perak</SelectItem>
                          <SelectItem value="lainnya">✨ Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="inv-unit" className="text-xs font-semibold">Satuan Unit</Label>
                      <Input
                        id="inv-unit"
                        placeholder="lot / gram / BTC / unit"
                        value={newInvUnit}
                        onChange={(e) => setNewInvUnit(e.target.value)}
                        required
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="inv-price" className="text-xs font-semibold">Harga per Unit Saat Ini (Opsional)</Label>
                    <CurrencyInput
                      value={newInvInitialPrice}
                      onValueChange={(num) => setNewInvInitialPrice(num.toString())}
                      placeholder="Rp 0"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dapat di-update sewaktu-waktu sesuai harga pasar terkini.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="inv-owner" className="text-xs font-semibold">Kepemilikan Aset</Label>
                    <Select value={newInvOwnerType} onValueChange={(v: "household" | "user") => setNewInvOwnerType(v)}>
                      <SelectTrigger id="inv-owner" className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {isAdmin && <SelectItem value="household">Keluarga (Household)</SelectItem>}
                        <SelectItem value="user">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddInvOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>Simpan Aset Investasi</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar Filter & Sort */}
      <div className="bg-card border border-border/80 p-4 rounded-xl shadow-xs">
        <DataTableToolbar
          searchQuery={invControls.searchQuery}
          onSearchChange={invControls.setSearchQuery}
          searchPlaceholder="Cari nama atau jenis aset investasi..."
          filterConfigs={invFilterConfigs}
          filters={invControls.filters}
          onFilterChange={invControls.setFilter}
          onClearFilters={invControls.clearAllFilters}
          activeFilterCount={invControls.activeFilterCount}
          sortOptions={invSortOptions}
          currentSortIndex={invSortIndex}
          onSortChange={(idx) => {
            setInvSortIndex(idx);
            invControls.setSortRules(invSortOptions[idx].rules);
          }}
        />
      </div>

      {/* Investment Assets Grid */}
      {hasError ? (
        <ErrorState onRetry={loadData} />
      ) : isLoading ? (
        <CardGridSkeleton count={3} />
      ) : investmentSummaries.length === 0 ? (
        <EmptyState
          icon={ChartLineUpIcon}
          title="Belum Ada Aset Investasi"
          description="Tambahkan aset saham, reksadana, emas, atau crypto baru untuk mulai mencatat portofolio keluarga Anda."
          actionLabel="Tambah Investasi Baru"
          onAction={() => setIsAddInvOpen(true)}
          isFiltered={invControls.activeFilterCount > 0 || invControls.searchQuery.trim() !== ""}
          onReset={invControls.clearAllFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {investmentSummaries.map(({ inv, currentQty, unitPrice, avgCostPerUnit, marketValue, returnAmount, returnPct }) => (
            <Card key={inv.id} className="relative overflow-hidden border border-border/80 shadow-2xs hover:shadow-md transition-all duration-200 group rounded-2xl flex flex-col justify-between">
              <CardHeader className="p-4 pb-3 border-b border-border/40 bg-muted/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-background border border-border/60 shadow-2xs shrink-0">
                      {getAssetIcon(inv.asset_type)}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base font-bold tracking-tight group-hover:text-primary transition-colors truncate">
                        {inv.asset_name}
                      </CardTitle>
                      <CardDescription className="capitalize text-xs flex items-center gap-1.5 mt-0.5 truncate">
                        <TagIcon className="size-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{inv.asset_type}</span>
                        <span>•</span>
                        <span className="shrink-0">{inv.owner_user_id ? "Personal" : "Keluarga"}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase bg-background px-2 py-0.5 shrink-0">
                    {inv.unit}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4 flex-1">
                {/* Metrics Breakdown Box */}
                <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-muted/30 rounded-xl border border-border/50">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[11px] text-muted-foreground font-medium">Total Unit</div>
                    <div className="font-bold text-sm font-mono tracking-tight text-foreground truncate">
                      {currentQty.toLocaleString("id-ID")} <span className="text-[11px] font-normal text-muted-foreground">{inv.unit}</span>
                    </div>
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[11px] text-muted-foreground font-medium">Harga Pasar / Unit</div>
                    <div className="font-bold text-sm font-mono tracking-tight text-foreground truncate">
                      {formatRupiah(unitPrice)}
                    </div>
                  </div>
                </div>

                {/* Valuation & Floating Return Summary */}
                <div className="space-y-2 pt-1 border-t border-border/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground font-medium">Nilai Pasar</span>
                    <Badge
                      variant={returnAmount >= 0 ? "default" : "destructive"}
                      className={`text-[11px] font-mono px-2 py-0.5 gap-1 rounded-md shrink-0 ${
                        returnAmount >= 0
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {returnAmount >= 0 ? "+" : ""}
                      {formatRupiah(returnAmount)} ({returnPct.toFixed(1)}%)
                    </Badge>
                  </div>

                  <div>
                    <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                      {formatRupiah(marketValue)}
                    </div>
                    {avgCostPerUnit > 0 && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between gap-2 border-t border-dashed border-border/40 pt-1.5">
                        <span>Modal Rata-rata:</span>
                        <span className="font-mono font-medium text-foreground">{formatRupiah(avgCostPerUnit)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs gap-1.5 h-9 rounded-lg"
                        onClick={() => {
                          setSelectedInvForVal(inv.id);
                          setNewValuationPrice(unitPrice.toString());
                        }}
                      >
                        <PencilSimpleIcon className="size-3.5 shrink-0" />
                        <span className="truncate">Update Harga</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px] rounded-2xl">
                      <form onSubmit={handleUpdateValuation}>
                        <DialogHeader>
                          <DialogTitle>Update Harga Pasar — {inv.asset_name}</DialogTitle>
                          <DialogDescription className="text-xs">
                            Masukkan estimasi harga pasar terkini per unit ({inv.unit}).
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label className="text-xs font-semibold">Harga Baru per {inv.unit}</Label>
                            <CurrencyInput
                              value={newValuationPrice}
                              onValueChange={(num) => setNewValuationPrice(num.toString())}
                              required
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button type="submit">Simpan Harga Baru</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="flex-1 text-xs gap-1.5 h-9 rounded-lg shadow-2xs"
                        onClick={() => {
                          setSelectedInvForTx(inv.id);
                          setInvTxPrice(unitPrice.toString());
                          setInvTxWalletId(accessibleWallets[0]?.id || "");
                        }}
                      >
                        <PlusIcon className="size-3.5 shrink-0" />
                        <span className="truncate">Beli / Jual</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[460px] rounded-2xl">
                      <form onSubmit={handleCreateInvTx}>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <ArrowsLeftRightIcon className="size-5 text-primary" />
                            Transaksi Investasi — {inv.asset_name}
                          </DialogTitle>
                          <DialogDescription className="text-xs">
                            Catat transaksi beli/jual dan hubungkan dengan wallet sumber/tujuan dana.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label className="text-xs font-semibold">Tipe Transaksi</Label>
                              <Select value={invTxType} onValueChange={(val: "buy" | "sell") => setInvTxType(val)}>
                                <SelectTrigger className="rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="buy">🟢 Beli (Potong Wallet)</SelectItem>
                                  <SelectItem value="sell">🔴 Jual (Tambah Wallet)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid gap-2">
                              <Label className="text-xs font-semibold">Wallet Terkait</Label>
                              <Select value={invTxWalletId} onValueChange={setInvTxWalletId}>
                                <SelectTrigger className="rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  {accessibleWallets.map((w) => (
                                    <SelectItem key={w.id} value={w.id}>
                                      {w.name} (Saldo: {formatRupiah(w.balance)})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label className="text-xs font-semibold">Jumlah Unit ({inv.unit})</Label>
                              <Input
                                type="number"
                                step="any"
                                placeholder="1.5"
                                value={invTxQty}
                                onChange={(e) => setInvTxQty(e.target.value)}
                                required
                                className="rounded-lg"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label className="text-xs font-semibold">Harga per {inv.unit}</Label>
                              <CurrencyInput
                                value={invTxPrice}
                                onValueChange={(num) => setInvTxPrice(num.toString())}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-xs font-semibold">Tanggal Transaksi</Label>
                            <Input
                              type="date"
                              value={invTxDate}
                              onChange={(e) => setInvTxDate(e.target.value)}
                              required
                              className="rounded-lg"
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button type="submit" disabled={isSubmitting}>Konfirmasi Transaksi</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DataPagination
        page={invControls.page}
        totalPages={invControls.totalPages}
        totalItems={invControls.totalItems}
        pageSize={invControls.pageSize}
        onPageChange={invControls.setPage}
      />

      {/* Investment Transactions History Section */}
      <Card className="rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ArrowsLeftRightIcon className="size-5 text-primary shrink-0" />
              <span>Riwayat Transaksi Investasi</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Daftar histori transaksi pembelian dan penjualan instrumen portofolio.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <DataTableToolbar
            searchQuery={itxControls.searchQuery}
            onSearchChange={itxControls.setSearchQuery}
            searchPlaceholder="Cari transaksi berdasarkan tanggal..."
            filters={itxControls.filters}
            onFilterChange={itxControls.setFilter}
            onClearFilters={itxControls.clearAllFilters}
            activeFilterCount={itxControls.activeFilterCount}
            sortOptions={itxSortOptions}
            currentSortIndex={itxSortIndex}
            onSortChange={(idx) => {
              setItxSortIndex(idx);
              itxControls.setSortRules(itxSortOptions[idx].rules);
            }}
          />

          {hasError ? (
            <ErrorState onRetry={loadData} />
          ) : isLoading ? (
            <DataTableSkeleton rows={5} cols={7} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs whitespace-nowrap">Tanggal</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Nama Aset</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Tipe</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Wallet Terkait</TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">Quantity</TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">Harga Unit</TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">Total Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itxControls.paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState
                          title="Belum Ada Transaksi Investasi"
                          description="Belum ada riwayat transaksi jual atau beli unit aset investasi."
                          isFiltered={itxControls.activeFilterCount > 0 || itxControls.searchQuery.trim() !== ""}
                          onReset={itxControls.clearAllFilters}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    itxControls.paginatedData.map((itx) => {
                      const inv = investments.find((i) => i.id === itx.investment_id);
                      const wallet = wallets.find((w) => w.id === itx.wallet_id);
                      const total = itx.quantity * itx.price;

                      return (
                        <TableRow key={itx.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-xs font-medium text-foreground whitespace-nowrap">
                            {itx.date}
                          </TableCell>
                          <TableCell className="font-semibold text-xs text-foreground whitespace-nowrap">
                            {inv?.asset_name || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant={itx.type === "buy" ? "default" : "secondary"}
                              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                                itx.type === "buy"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {itx.type === "buy" ? "BELI" : "JUAL"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <WalletIcon className="size-3.5 text-muted-foreground shrink-0" />
                              <span>{wallet?.name || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-medium whitespace-nowrap">
                            {itx.quantity.toLocaleString("id-ID")} {inv?.unit}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {formatRupiah(itx.price)}
                          </TableCell>
                          <TableCell className="text-right font-bold font-mono text-xs text-foreground whitespace-nowrap">
                            {formatRupiah(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <DataPagination
            page={itxControls.page}
            totalPages={itxControls.totalPages}
            totalItems={itxControls.totalItems}
            pageSize={itxControls.pageSize}
            onPageChange={itxControls.setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
