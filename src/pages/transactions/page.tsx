import React, { useState } from "react";
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
} from "@phosphor-icons/react";
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
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txWalletId, setTxWalletId] = useState<string>(accessibleWallets[0]?.id || "");
  const [txCategoryId, setTxCategoryId] = useState<string>(store.categories[0]?.id || "");
  const [txOwnerId, setTxOwnerId] = useState<string>(activeUser.id);
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
      owner_id: txOwnerId,
      type: txType,
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

        <div className="flex items-center gap-3">
          {/* Add Transaction Dialog */}
          <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusIcon className="size-4" />
                Tambah Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleCreateTransaction}>
                <DialogHeader>
                  <DialogTitle>Catat Transaksi Baru</DialogTitle>
                  <DialogDescription>
                    Pilih tipe transaksi, wallet, dan alokasi pemilik dana.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* Warnings */}
                  {isBalanceShort && (
                    <Alert variant="destructive" className="py-2">
                      <WarningIcon className="size-4" />
                      <AlertTitle className="text-xs font-bold">Saldo Tidak Cukup</AlertTitle>
                      <AlertDescription className="text-xs">
                        Saldo dompet {selectedWallet?.name} hanya Rp {selectedWallet?.balance.toLocaleString("id-ID")}.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isOverbudget && (
                    <Alert className="border-amber-500/50 text-amber-600 bg-amber-500/10 py-2">
                      <WarningIcon className="size-4 text-amber-600" />
                      <AlertTitle className="text-xs font-bold">Peringatan Overbudget</AlertTitle>
                      <AlertDescription className="text-xs">
                        Kategori {selectedCategory?.name} akan melebihi budget Rp {categoryBudget?.target_amount.toLocaleString("id-ID")}.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Tipe Transaksi</Label>
                      <Select value={txType} onValueChange={(val: "income" | "expense") => setTxType(val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Pengeluaran (Expense)</SelectItem>
                          <SelectItem value="income">Pemasukan (Income)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Pemilik Uang (Owner)</Label>
                      <Select value={txOwnerId} onValueChange={setTxOwnerId}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {store.users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Pilih Wallet</Label>
                      <Select value={txWalletId} onValueChange={setTxWalletId}>
                        <SelectTrigger>
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

                    <div className="grid gap-2">
                      <Label>Kategori</Label>
                      <Select value={txCategoryId} onValueChange={setTxCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {store.categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Jumlah Nominal (Rp)</Label>
                      <Input
                        type="number"
                        placeholder="Contoh: 150000"
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Tanggal</Label>
                      <Input
                        type="date"
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Catatan / Keterangan</Label>
                    <Input
                      placeholder="Makan siang bersama tim / Belanja bulanan..."
                      value={txNote}
                      onChange={(e) => setTxNote(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isBalanceShort}>
                    Simpan Transaksi
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Transfer Dialog */}
          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SwapIcon className="size-4" />
                Transfer Dana
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <form onSubmit={handleCreateTransfer}>
                <DialogHeader>
                  <DialogTitle>Transfer Antar Wallet</DialogTitle>
                  <DialogDescription>
                    Pindah dana antar dompet (Wallet Asal member terisolasi, Wallet Tujuan bebas di household).
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Wallet Asal (Sumber)</Label>
                      <Select value={trFromWalletId} onValueChange={setTrFromWalletId}>
                        <SelectTrigger>
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

                    <div className="grid gap-2">
                      <Label>Wallet Tujuan</Label>
                      <Select value={trToWalletId} onValueChange={setTrToWalletId}>
                        <SelectTrigger>
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
                    <div className="grid gap-2">
                      <Label>Jumlah Nominal (Rp)</Label>
                      <Input
                        type="number"
                        placeholder="1000000"
                        value={trAmount}
                        onChange={(e) => setTrAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Biaya Transfer (Rp)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={trFee}
                        onChange={(e) => setTrFee(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={trDate}
                      onChange={(e) => setTrDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Catatan</Label>
                    <Input
                      placeholder="Top up Kantong Jago / Uang jajan..."
                      value={trNote}
                      onChange={(e) => setTrNote(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit">Eksekusi Transfer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="transactions" className="gap-2">
            <ReceiptIcon className="size-4" />
            Riwayat Transaksi ({filteredTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="transfers" className="gap-2">
            <SwapIcon className="size-4" />
            Transfer Dana ({store.transfers.length})
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
      </Tabs>
    </div>
  );
}
