import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import * as transactionsService from "@/services/transactions.service";
import * as transfersService from "@/services/transfers.service";
import * as walletsService from "@/services/wallets.service";
import * as categoriesService from "@/services/categories.service";
import * as householdsService from "@/services/households.service";
import type { HouseholdMemberResponse } from "@/services/households.service";
import * as reservationsService from "@/services/reservations.service";
import * as budgetsService from "@/services/budgets.service";
import * as goalsService from "@/services/goals.service";
import { EncroachmentDialog } from "@/components/feature/budgets/encroachment-dialog";
import { useDataControls, type FilterConfig } from "@/hooks/use-data-controls";
import { DataTableToolbar } from "@/components/common/data-table-toolbar";
import { DataPagination } from "@/components/common/data-table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { DataTableSkeleton } from "@/components/common/loading-skeleton";
import { ErrorState } from "@/components/common/error-state";
import {
  ArrowsDownUpIcon,
  PlusIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  WarningIcon,
  ProhibitIcon,
  ReceiptIcon,
  SwapIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { CategoryManagement } from "@/components/feature/categories/category-management";
import type { Wallet, Category, Transaction, Transfer, Reservation, Budget, Goal } from "@/types";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatRupiah } from "@/libs/number";
import { Button } from "@/components/ui/button";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TransactionsPage() {
  const { user } = useAuth();
  const activeUserId = user?.id ?? "";

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [members, setMembers] = useState<HouseholdMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [walletList, categoryList, transactionList, transferList, memberList] = await Promise.all([
        walletsService.listWallets(),
        categoriesService.listCategories(),
        transactionsService.listTransactions(),
        transfersService.listTransfers(),
        householdsService.listMembers(),
      ]);
      setWallets(walletList);
      setCategories(categoryList);
      setTransactions(transactionList);
      setTransfers(transferList);
      setMembers(memberList);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const accessibleWallets = wallets;

  // New Transaction Form State
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense" | "transfer">("expense");
  const [txWalletId, setTxWalletId] = useState<string>("");
  const [txCategoryId, setTxCategoryId] = useState<string>("");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [txNote, setTxNote] = useState<string>("");

  useEffect(() => {
    if (!txWalletId && wallets.length > 0) {
      setTxWalletId(wallets[0].id);
    }
  }, [wallets, txWalletId]);

  // New Transfer Form State
  const [trFromWalletId, setTrFromWalletId] = useState<string>("");
  const [trToWalletId, setTrToWalletId] = useState<string>("");
  const [trAmount, setTrAmount] = useState<string>("");
  const [trFee, setTrFee] = useState<string>("0");
  const [trDate, setTrDate] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!trFromWalletId && wallets.length > 0) {
      setTrFromWalletId(wallets[0].id);
    }
    if (!trToWalletId && wallets.length > 1) {
      setTrToWalletId(wallets.find((w) => w.id !== wallets[0]?.id)?.id || "");
    }
  }, [wallets, trFromWalletId, trToWalletId]);

  const availableCategories = useMemo(() => {
    return categories.filter(
      (c) => c.is_active && (c.type === "both" || c.type === txType)
    );
  }, [categories, txType]);

  const effectiveCategoryId =
    txCategoryId && availableCategories.some((c) => c.id === txCategoryId)
      ? txCategoryId
      : availableCategories[0]?.id || "";

  // Live Warning calculations
  const numTxAmount = parseFloat(txAmount) || 0;
  const selectedWallet = wallets.find((w) => w.id === txWalletId);
  const isBalanceShort = txType === "expense" && selectedWallet && selectedWallet.balance < numTxAmount;

  // Encroachment Modal State
  const [encroachmentOpen, setEncroachmentOpen] = useState(false);
  const [encroachmentShortfall, setEncroachmentShortfall] = useState(0);
  const [encroachmentWallet, setEncroachmentWallet] = useState<Wallet | null>(null);
  const [encroachmentReservations, setEncroachmentReservations] = useState<Reservation[]>([]);
  const [encroachmentBudgets, setEncroachmentBudgets] = useState<Budget[]>([]);
  const [encroachmentGoals, setEncroachmentGoals] = useState<Goal[]>([]);

  const submitTransaction = async (
    encroachments?: Array<{ budget_id?: string; goal_id?: string; amount: number }>
  ) => {
    await transactionsService.createTransaction({
      wallet_id: txWalletId,
      category_id: effectiveCategoryId,
      owner_id: activeUserId,
      type: txType as "income" | "expense",
      amount: numTxAmount,
      date: txDate,
      note: txNote,
      encroachments,
    });
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txWalletId || !effectiveCategoryId || numTxAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await submitTransaction();
      toast.success("Transaksi berhasil dicatat!");
      setTxAmount("");
      setTxNote("");
      setIsTxOpen(false);
      loadData();
    } catch (err) {
      const response =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string; shortfall?: number } } }).response
          : undefined;

      if (response?.data?.message === "ENCROACHMENT_REQUIRED") {
        const wallet = wallets.find((w) => w.id === txWalletId) || null;
        setEncroachmentShortfall(response.data.shortfall || 0);
        setEncroachmentWallet(wallet);
        try {
          const [reservations, budgetList, goalList] = await Promise.all([
            reservationsService.listReservationsByWallet(txWalletId),
            budgetsService.listBudgets(),
            goalsService.listGoals(),
          ]);
          setEncroachmentReservations(reservations);
          setEncroachmentBudgets(budgetList.map((b) => ({
            id: b.id,
            owner_user_id: b.owner_user_id,
            owner_household_id: b.owner_household_id,
            category_id: b.category_id,
            name: b.name,
            target_amount: b.target_amount,
            period: b.period,
            start_date: b.start_date,
          })));
          setEncroachmentGoals(goalList.map((g) => ({
            id: g.id,
            owner_user_id: g.owner_user_id,
            owner_household_id: g.owner_household_id,
            name: g.name,
            target_amount: g.target_amount,
            target_date: g.target_date ?? undefined,
            status: g.status,
          })));
          setEncroachmentOpen(true);
        } catch {
          toast.error("Gagal memuat data reservasi untuk encroachment.");
        }
      } else {
        toast.error("Gagal mencatat transaksi", { description: response?.data?.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEncroachment = async (
    allocations: Array<{ budget_id?: string; goal_id?: string; amount: number }>
  ) => {
    setIsSubmitting(true);
    try {
      await submitTransaction(allocations);
      toast.success("Transaksi berhasil dicatat dengan atribusi encroachment!");
      setTxAmount("");
      setTxNote("");
      setEncroachmentOpen(false);
      setIsTxOpen(false);
      loadData();
    } catch (err) {
      const description =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error("Gagal mencatat transaksi", { description });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoidTransaction = async (id: string) => {
    try {
      await transactionsService.voidTransaction(id);
      toast.info("Transaksi berhasil di-void / dibatalkan");
      loadData();
    } catch {
      toast.error("Gagal membatalkan transaksi.");
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(trAmount) || 0;
    const fee = parseFloat(trFee) || 0;

    if (!trFromWalletId || !trToWalletId || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await transfersService.createTransfer({
        from_wallet_id: trFromWalletId,
        to_wallet_id: trToWalletId,
        amount,
        fee,
        date: trDate,
      });
      toast.success(`Transfer sebesar ${formatRupiah(amount)} berhasil!`);
      setTrAmount("");
      setTrFee("0");
      setIsTxOpen(false);
      loadData();
    } catch (err) {
      const description =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error("Gagal membuat transfer", { description });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoidTransfer = async (id: string) => {
    try {
      await transfersService.voidTransfer(id);
      toast.info("Transfer berhasil dibatalkan / void");
      loadData();
    } catch {
      toast.error("Gagal membatalkan transfer.");
    }
  };

  // Backend GET /transactions sudah membatasi hasil sesuai wallet yang bisa diakses user.
  const rawFilteredTransactions = transactions;

  // Data Controls for Transactions Tab
  const txFilterConfigs = useMemo<FilterConfig<Transaction>[]>(() => {
    return [
      {
        id: "type",
        label: "Tipe Transaksi",
        type: "select",
        options: [
          { label: "Pengeluaran (Expense)", value: "expense" },
          { label: "Pemasukan (Income)", value: "income" },
        ],
      },
      {
        id: "wallet_id",
        label: "Wallet",
        type: "select",
        options: wallets.map((w) => ({ label: w.name, value: w.id })),
      },
      {
        id: "category_id",
        label: "Kategori",
        type: "select",
        options: categories.map((c) => ({ label: c.name, value: c.id })),
      },
      {
        id: "status",
        label: "Status Transaksi",
        type: "select",
        options: [
          { label: "Aktif", value: "active" },
          { label: "Void / Dibatalkan", value: "void" },
        ],
      },
    ];
  }, [wallets, categories]);

  const txSortOptions = useMemo(() => {
    return [
      {
        label: "Tanggal Terbaru",
        rules: [{ field: "date", order: "desc" as const }],
      },
      {
        label: "Tanggal Terlama",
        rules: [{ field: "date", order: "asc" as const }],
      },
      {
        label: "Nominal Terbesar",
        rules: [{ field: "amount", order: "desc" as const }],
      },
      {
        label: "Nominal Terkecil",
        rules: [{ field: "amount", order: "asc" as const }],
      },
    ];
  }, []);

  const [txSortIndex, setTxSortIndex] = useState(0);

  const txControls = useDataControls({
    data: rawFilteredTransactions,
    searchFields: ["note", "date"],
    initialSort: txSortOptions[0].rules,
    initialPageSize: 10,
  });

  // Data Controls for Transfers Tab
  const trSortOptions = useMemo(() => {
    return [
      { label: "Tanggal Terbaru", rules: [{ field: "date", order: "desc" as const }] },
      { label: "Tanggal Terlama", rules: [{ field: "date", order: "asc" as const }] },
      { label: "Nominal Terbesar", rules: [{ field: "amount", order: "desc" as const }] },
    ];
  }, []);

  const [trSortIndex, setTrSortIndex] = useState(0);

  const trControls = useDataControls({
    data: transfers,
    searchFields: ["note", "date"],
    initialSort: trSortOptions[0].rules,
    initialPageSize: 10,
  });

  return (
    <div className="py-8 px-6 sm:px-8 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/60 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ArrowsDownUpIcon className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Transaksi & Transfer Antar Wallet</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Catat pengeluaran/pemasukan harian dan transfer dana antar dompet keluarga dengan notifikasi saldo & budget.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Unified Transaction & Transfer Dialog */}
          <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                <PlusIcon className="size-4" />
                Catat Transaksi / Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <ArrowsDownUpIcon className="size-5 text-primary" />
                  Catat Transaksi / Transfer
                </DialogTitle>
                <DialogDescription>
                  Pilih jenis transaksi untuk mencatat pengeluaran, pemasukan, atau mutasi dana antar dompet.
                </DialogDescription>
              </DialogHeader>

              {/* Mode Switcher Tabs */}
              <Tabs
                value={txType}
                onValueChange={(val) => {
                  setTxType(val as "income" | "expense" | "transfer");
                }}
                className="w-full mt-2"
              >
                <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1 rounded-lg">
                  <TabsTrigger
                    value="expense"
                    className="data-[state=active]:bg-background data-[state=active]:text-rose-600 data-[state=active]:shadow-xs gap-1.5 text-xs font-semibold"
                  >
                    <ArrowUpRightIcon className="size-3.5 text-rose-500" />
                    Pengeluaran
                  </TabsTrigger>
                  <TabsTrigger
                    value="income"
                    className="data-[state=active]:bg-background data-[state=active]:text-emerald-600 data-[state=active]:shadow-xs gap-1.5 text-xs font-semibold"
                  >
                    <ArrowDownLeftIcon className="size-3.5 text-emerald-500" />
                    Pemasukan
                  </TabsTrigger>
                  <TabsTrigger
                    value="transfer"
                    className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs gap-1.5 text-xs font-semibold"
                  >
                    <SwapIcon className="size-3.5 text-primary" />
                    Transfer Dana
                  </TabsTrigger>
                </TabsList>

                {/* Form Pengeluaran / Pemasukan */}
                {txType !== "transfer" ? (
                  <form onSubmit={handleCreateTransaction} className="space-y-4 pt-4">
                    {/* Warnings */}
                    {isBalanceShort && (
                      <Alert variant="destructive" className="py-2.5 bg-destructive/10 border-destructive/20 text-destructive">
                        <WarningIcon className="size-4 mt-0.5" />
                        <div>
                          <AlertTitle className="text-xs font-bold">Saldo Tidak Cukup</AlertTitle>
                          <AlertDescription className="text-xs">
                            Saldo dompet <strong>{selectedWallet?.name}</strong> hanya Rp {selectedWallet?.balance.toLocaleString("id-ID")}.
                          </AlertDescription>
                        </div>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Pilih Wallet</Label>
                        <Select value={txWalletId} onValueChange={setTxWalletId}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Pilih wallet" />
                          </SelectTrigger>
                          <SelectContent>
                            {accessibleWallets.map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.name} (Rp {w.balance.toLocaleString("id-ID")})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Kategori</Label>
                        <Select value={txCategoryId} onValueChange={setTxCategoryId}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Jumlah Nominal</Label>
                        <CurrencyInput
                          placeholder="0"
                          className="h-9"
                          value={txAmount}
                          onValueChange={(num) => setTxAmount(num.toString())}
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Tanggal</Label>
                        <Input
                          type="date"
                          className="h-9"
                          value={txDate}
                          onChange={(e) => setTxDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label className="text-xs font-medium">Catatan / Keterangan</Label>
                      <Input
                        placeholder="Makan siang bersama tim / Belanja bulanan..."
                        className="h-9"
                        value={txNote}
                        onChange={(e) => setTxNote(e.target.value)}
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="ghost" onClick={() => setIsTxOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={isBalanceShort} className="gap-1.5">
                        Simpan Transaksi
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  /* Form Transfer Dana */
                  <form onSubmit={handleCreateTransfer} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Wallet Asal (Sumber)</Label>
                        <Select value={trFromWalletId} onValueChange={setTrFromWalletId}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {accessibleWallets.map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.name} (Rp {w.balance.toLocaleString("id-ID")})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Wallet Tujuan</Label>
                        <Select value={trToWalletId} onValueChange={setTrToWalletId}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {wallets.map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.name} ({w.owner_user_id ? "Personal" : "Bersama"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Jumlah Nominal</Label>
                        <CurrencyInput
                          placeholder="0"
                          className="h-9"
                          value={trAmount}
                          onValueChange={(num) => setTrAmount(num.toString())}
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Biaya Transfer</Label>
                        <CurrencyInput
                          placeholder="0"
                          className="h-9"
                          value={trFee}
                          onValueChange={(num) => setTrFee(num.toString())}
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label className="text-xs font-medium">Tanggal</Label>
                      <Input
                        type="date"
                        className="h-9"
                        value={trDate}
                        onChange={(e) => setTrDate(e.target.value)}
                        required
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="ghost" onClick={() => setIsTxOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                        Eksekusi Transfer
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="transactions" className="gap-2">
            <ReceiptIcon className="size-4" />
            Riwayat Transaksi ({txControls.totalItems})
          </TabsTrigger>
          <TabsTrigger value="transfers" className="gap-2">
            <SwapIcon className="size-4" />
            Transfer Dana ({trControls.totalItems})
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <TagIcon className="size-4" />
            Kategori Transaksi ({categories.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Transactions Table */}
        <TabsContent value="transactions" className="pt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b">
              <div>
                <CardTitle className="text-lg">Transaksi Pemasukan & Pengeluaran</CardTitle>
                <CardDescription>
                  Daftar transaksi aktif dan void. Pengguna dapat membatalkan (void) transaksi kapan saja.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <DataTableToolbar
                searchQuery={txControls.searchQuery}
                onSearchChange={txControls.setSearchQuery}
                searchPlaceholder="Cari transaksi berdasarkan catatan..."
                filterConfigs={txFilterConfigs}
                filters={txControls.filters}
                onFilterChange={txControls.setFilter}
                onClearFilters={txControls.clearAllFilters}
                activeFilterCount={txControls.activeFilterCount}
                sortOptions={txSortOptions}
                currentSortIndex={txSortIndex}
                onSortChange={(idx) => {
                  setTxSortIndex(idx);
                  txControls.setSortRules(txSortOptions[idx].rules);
                }}
              />

              {hasError ? (
                <ErrorState onRetry={loadData} />
              ) : isLoading ? (
                <DataTableSkeleton rows={5} cols={8} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Tipe & Status</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Pemilik / Inputer</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txControls.paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <EmptyState
                            icon={ReceiptIcon}
                            title="Tidak Ada Transaksi"
                            description="Belum ada transaksi pengeluaran atau pemasukan yang tercatat."
                            isFiltered={txControls.activeFilterCount > 0 || txControls.searchQuery.trim() !== ""}
                            onReset={txControls.clearAllFilters}
                            actionLabel="Catat Transaksi"
                            onAction={() => setIsTxOpen(true)}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                    txControls.paginatedData.map((tx) => {
                      const wallet = wallets.find((w) => w.id === tx.wallet_id);
                      const category = categories.find((c) => c.id === tx.category_id);
                      const owner = members.find((m) => m.user_id === tx.owner_id);
                      const recorder = members.find((m) => m.user_id === tx.recorded_by);
                      const isVoid = tx.status === "void";

                      return (
                        <TableRow key={tx.id} className={isVoid ? "opacity-40 bg-muted/20 line-through" : ""}>
                          <TableCell className="font-mono text-xs">{tx.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {tx.type === "income" ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1 text-[11px]">
                                  <ArrowDownLeftIcon className="size-3" /> Income
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-rose-500/15 text-rose-600 border-rose-500/30 gap-1 text-[11px]">
                                  <ArrowUpRightIcon className="size-3" /> Expense
                                </Badge>
                              )}
                              {isVoid && (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  VOID
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-xs">{category?.name || "-"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{wallet?.name || "-"}</TableCell>
                          <TableCell className="text-xs">
                            <div>{owner?.name}</div>
                            {recorder && recorder.user_id !== owner?.user_id && (
                              <div className="text-[10px] text-muted-foreground">by {recorder.name}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{tx.note || "-"}</TableCell>
                          <TableCell className={`text-right font-semibold text-sm ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                            {tx.type === "income" ? "+" : "-"} {formatRupiah(tx.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {!isVoid && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                onClick={() => handleVoidTransaction(tx.id)}
                              >
                                <ProhibitIcon className="size-3.5 mr-1" />
                                Void
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              )}

              <DataPagination
                page={txControls.page}
                totalPages={txControls.totalPages}
                totalItems={txControls.totalItems}
                pageSize={txControls.pageSize}
                onPageChange={txControls.setPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Transfers Table */}
        <TabsContent value="transfers" className="pt-4 space-y-4">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-lg">Riwayat Transfer Antar Wallet</CardTitle>
              <CardDescription>
                Pencatatan mutasi internal saldo yang tidak memengaruhi total pendapatan/pengeluaran household.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <DataTableToolbar
                searchQuery={trControls.searchQuery}
                onSearchChange={trControls.setSearchQuery}
                searchPlaceholder="Cari transfer berdasarkan catatan..."
                filters={trControls.filters}
                onFilterChange={trControls.setFilter}
                onClearFilters={trControls.clearAllFilters}
                activeFilterCount={trControls.activeFilterCount}
                sortOptions={trSortOptions}
                currentSortIndex={trSortIndex}
                onSortChange={(idx) => {
                  setTrSortIndex(idx);
                  trControls.setSortRules(trSortOptions[idx].rules);
                }}
              />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Dari Wallet</TableHead>
                    <TableHead>Ke Wallet</TableHead>
                    <TableHead className="text-right">Nominal Transfer</TableHead>
                    <TableHead className="text-right">Biaya Admin</TableHead>
                    <TableHead className="text-center">Status & Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hasError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <ErrorState onRetry={loadData} />
                      </TableCell>
                    </TableRow>
                  ) : isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <DataTableSkeleton rows={3} cols={6} />
                      </TableCell>
                    </TableRow>
                  ) : trControls.paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Belum ada transfer dana yang sesuai.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trControls.paginatedData.map((tr) => {
                      const fromW = wallets.find((w) => w.id === tr.from_wallet_id);
                      const toW = wallets.find((w) => w.id === tr.to_wallet_id);
                      const isVoid = tr.status === "void";

                      return (
                        <TableRow key={tr.id} className={isVoid ? "opacity-40 line-through bg-muted/20" : ""}>
                          <TableCell className="font-mono text-xs">{tr.date}</TableCell>
                          <TableCell className="font-medium text-xs">{fromW?.name}</TableCell>
                          <TableCell className="font-medium text-xs text-primary">{toW?.name}</TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            {formatRupiah(tr.amount)}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {tr.fee > 0 ? formatRupiah(tr.fee) : "Gratis"}
                          </TableCell>
                          <TableCell className="text-center">
                            {isVoid ? (
                              <Badge variant="outline" className="text-[10px]">
                                VOID
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                                onClick={() => handleVoidTransfer(tr.id)}
                              >
                                <ProhibitIcon className="size-3.5 mr-1" />
                                Void
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              <DataPagination
                page={trControls.page}
                totalPages={trControls.totalPages}
                totalItems={trControls.totalItems}
                pageSize={trControls.pageSize}
                onPageChange={trControls.setPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Category Management */}
        <TabsContent value="categories" className="pt-4">
          <CategoryManagement />
        </TabsContent>
      </Tabs>

      <EncroachmentDialog
        open={encroachmentOpen}
        onOpenChange={setEncroachmentOpen}
        shortfall={encroachmentShortfall}
        wallet={encroachmentWallet}
        reservations={encroachmentReservations}
        budgets={encroachmentBudgets}
        goals={encroachmentGoals}
        onConfirm={handleConfirmEncroachment}
      />
    </div>
  );
}

