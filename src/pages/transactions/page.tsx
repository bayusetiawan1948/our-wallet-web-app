import React, { useState, useMemo, useEffect } from "react";
import { useMockStore } from "@/lib/mock-store";
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
import { CategoryManagement } from "@/components/categories/category-management";
import { ImportTransactionsDialog } from "@/components/transactions/import-transactions-dialog";
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
  const store = useMockStore();
  const activeUser = store.getActiveUser();
  const accessibleWallets = store.getAccessibleWallets();

  // New Transaction Form State
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense" | "transfer">("expense");
  const [txWalletId, setTxWalletId] = useState<string>(accessibleWallets[0]?.id || "");
  const [txCategoryId, setTxCategoryId] = useState<string>("");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [txNote, setTxNote] = useState<string>("");

  // New Transfer Form State
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [trFromWalletId, setTrFromWalletId] = useState<string>(accessibleWallets[0]?.id || "");
  const [trToWalletId, setTrToWalletId] = useState<string>(
    store.wallets.find((w) => w.id !== accessibleWallets[0]?.id)?.id || ""
  );
  const [trAmount, setTrAmount] = useState<string>("");
  const [trFee, setTrFee] = useState<string>("0");
  const [trDate, setTrDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [trNote, setTrNote] = useState<string>("");

  const availableCategories = useMemo(() => {
    return store.categories.filter(
      (c) => c.is_active && (c.type === "both" || c.type === txType)
    );
  }, [store.categories, txType]);

  // Default txCategoryId to first available category [0]
  useEffect(() => {
    if (availableCategories.length > 0) {
      if (!txCategoryId || !availableCategories.some((c) => c.id === txCategoryId)) {
        setTxCategoryId(availableCategories[0].id);
      }
    } else {
      setTxCategoryId("");
    }
  }, [availableCategories, txCategoryId]);

  // Live Warning calculations
  const numTxAmount = parseFloat(txAmount) || 0;
  const selectedWallet = store.wallets.find((w) => w.id === txWalletId);
  const isBalanceShort = txType === "expense" && selectedWallet && selectedWallet.balance < numTxAmount;

  const selectedCategory = store.categories.find((c) => c.id === txCategoryId);
  const categoryBudget = store.budgets.find((b) => b.category_id === txCategoryId);

  const currentCatExpenses = store.transactions
    .filter((t) => t.category_id === txCategoryId && t.type === "expense" && t.status === "active")
    .reduce((sum, t) => sum + t.amount, 0);

  const isOverbudget =
    txType === "expense" &&
    categoryBudget &&
    currentCatExpenses + numTxAmount > categoryBudget.target_amount;

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txWalletId || !txCategoryId || numTxAmount <= 0) return;

    const success = store.addTransaction({
      wallet_id: txWalletId,
      category_id: txCategoryId,
      owner_id: activeUser.id,
      type: txType as "income" | "expense",
      amount: numTxAmount,
      date: txDate,
      note: txNote,
    });

    if (success) {
      setTxAmount("");
      setTxNote("");
      setIsTxOpen(false);
    }
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(trAmount) || 0;
    const fee = parseFloat(trFee) || 0;

    if (!trFromWalletId || !trToWalletId || amount <= 0) return;

    const success = store.addTransfer(trFromWalletId, trToWalletId, amount, fee, trDate, trNote);
    if (success) {
      setTrAmount("");
      setTrFee("0");
      setTrNote("");
      setIsTransferOpen(false);
    }
  };

  // Filter transactions based on role
  const filteredTransactions = store.transactions.filter((tx) => {
    if (store.activeRole === "admin") return true;
    return accessibleWallets.some((w) => w.id === tx.wallet_id) || tx.owner_id === activeUser.id;
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
          <ImportTransactionsDialog />
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
                {txType !== ("transfer" as any) ? (
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

                    {isOverbudget && (
                      <Alert className="border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 py-2.5">
                        <WarningIcon className="size-4 text-amber-600 mt-0.5" />
                        <div>
                          <AlertTitle className="text-xs font-bold">Peringatan Overbudget</AlertTitle>
                          <AlertDescription className="text-xs">
                            Kategori <strong>{selectedCategory?.name}</strong> akan melebihi budget Rp {categoryBudget?.target_amount.toLocaleString("id-ID")}.
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
                        <Label className="text-xs font-medium">Jumlah Nominal (Rp)</Label>
                        <Input
                          type="number"
                          placeholder="Contoh: 150000"
                          className="h-9"
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
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
                            {store.wallets.map((w) => (
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
                        <Label className="text-xs font-medium">Jumlah Nominal (Rp)</Label>
                        <Input
                          type="number"
                          placeholder="1000000"
                          className="h-9"
                          value={trAmount}
                          onChange={(e) => setTrAmount(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Biaya Transfer (Rp)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="h-9"
                          value={trFee}
                          onChange={(e) => setTrFee(e.target.value)}
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

                    <div className="grid gap-1.5">
                      <Label className="text-xs font-medium">Catatan / Keterangan</Label>
                      <Input
                        placeholder="Top up Kantong Jago / Transfer uang jajan..."
                        className="h-9"
                        value={trNote}
                        onChange={(e) => setTrNote(e.target.value)}
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="ghost" onClick={() => setIsTxOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="gap-1.5">
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
            Riwayat Transaksi ({filteredTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="transfers" className="gap-2">
            <SwapIcon className="size-4" />
            Transfer Dana ({store.transfers.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <TagIcon className="size-4" />
            Kategori Transaksi ({store.categories.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Transactions Table */}
        <TabsContent value="transactions" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Transaksi Pemasukan & Pengeluaran</CardTitle>
                <CardDescription>
                  Daftar transaksi aktif dan void. Pengguna dapat membatalkan (void) transaksi kapan saja.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
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
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        Belum ada transaksi.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const wallet = store.wallets.find((w) => w.id === tx.wallet_id);
                      const category = store.categories.find((c) => c.id === tx.category_id);
                      const owner = store.users.find((u) => u.id === tx.owner_id);
                      const recorder = store.users.find((u) => u.id === tx.recorded_by);
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
                            {recorder && recorder.id !== owner?.id && (
                              <div className="text-[10px] text-muted-foreground">by {recorder.name}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{tx.note || "-"}</TableCell>
                          <TableCell className={`text-right font-semibold text-sm ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                            {tx.type === "income" ? "+" : "-"} Rp {tx.amount.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-center">
                            {!isVoid && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                onClick={() => store.voidTransaction(tx.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Transfers Table */}
        <TabsContent value="transfers" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Riwayat Transfer Antar Wallet</CardTitle>
              <CardDescription>
                Pencatatan mutasi internal saldo yang tidak memengaruhi total pendapatan/pengeluaran household.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Dari Wallet</TableHead>
                    <TableHead>Ke Wallet</TableHead>
                    <TableHead className="text-right">Nominal Transfer</TableHead>
                    <TableHead className="text-right">Biaya Admin</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-center">Status & Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        Belum ada transfer dana.
                      </TableCell>
                    </TableRow>
                  ) : (
                    store.transfers.map((tr) => {
                      const fromW = store.wallets.find((w) => w.id === tr.from_wallet_id);
                      const toW = store.wallets.find((w) => w.id === tr.to_wallet_id);
                      const isVoid = tr.status === "void";

                      return (
                        <TableRow key={tr.id} className={isVoid ? "opacity-40 line-through bg-muted/20" : ""}>
                          <TableCell className="font-mono text-xs">{tr.date}</TableCell>
                          <TableCell className="font-medium text-xs">{fromW?.name}</TableCell>
                          <TableCell className="font-medium text-xs text-primary">{toW?.name}</TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            Rp {tr.amount.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {tr.fee > 0 ? `Rp ${tr.fee.toLocaleString("id-ID")}` : "Gratis"}
                          </TableCell>
                          <TableCell className="text-xs">{tr.note || "-"}</TableCell>
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
                                onClick={() => store.voidTransfer(tr.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Category Management */}
        <TabsContent value="categories" className="pt-4">
          <CategoryManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
