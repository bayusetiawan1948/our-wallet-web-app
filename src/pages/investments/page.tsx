import React, { useState } from "react";
import { useMockStore } from "@/lib/mock-store";
import {
  ChartLineUpIcon,
  PlusIcon,
  PencilSimpleIcon,
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

export default function InvestmentPage() {
  const store = useMockStore();
  const accessibleWallets = store.getAccessibleWallets();

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

  const handleUpdateValuation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvForVal || !newValuationPrice) return;
    store.updateInvestmentValuation(selectedInvForVal, parseFloat(newValuationPrice) || 0);
    setNewValuationPrice("");
    setSelectedInvForVal(null);
  };

  const handleCreateInvTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvForTx || !invTxWalletId || !invTxQty || !invTxPrice) return;

    const qty = parseFloat(invTxQty) || 0;
    const price = parseFloat(invTxPrice) || 0;

    const success = store.addInvestmentTransaction(
      selectedInvForTx,
      invTxWalletId,
      invTxType,
      qty,
      price,
      invTxDate
    );

    if (success) {
      setInvTxQty("");
      setInvTxPrice("");
      setSelectedInvForTx(null);
    }
  };

  // Calculate investment summaries
  const investmentSummaries = store.investments.map((inv) => {
    const activeTxs = store.investmentTransactions.filter(
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

    const latestValuation = store.valuations.find((v) => v.investment_id === inv.id);
    const unitPrice = latestValuation ? latestValuation.price_per_unit : 0;
    const marketValue = currentQty * unitPrice;
    const returnAmount = marketValue - totalCost;
    const returnPct = totalCost > 0 ? (returnAmount / totalCost) * 100 : 0;

    return {
      inv,
      currentQty,
      totalCost,
      unitPrice,
      marketValue,
      returnAmount,
      returnPct,
    };
  });

  const totalPortfolioMarketValue = investmentSummaries.reduce((sum, s) => sum + s.marketValue, 0);
  const totalPortfolioCostBasis = investmentSummaries.reduce((sum, s) => sum + s.totalCost, 0);
  const totalReturnAmount = totalPortfolioMarketValue - totalPortfolioCostBasis;
  const totalReturnPct = totalPortfolioCostBasis > 0 ? (totalReturnAmount / totalPortfolioCostBasis) * 100 : 0;

  return (
    <div className="py-8 px-6 sm:px-8 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/60 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ChartLineUpIcon className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Portofolio & Transaksi Investasi</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Lacak aset emas, crypto, dan saham keluarga, update harga pasar real-time, dan hubungkan dengan wallet.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border border-border/40">
          <div>
            <div className="text-xs text-muted-foreground">Total Nilai Portofolio</div>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              Rp {totalPortfolioMarketValue.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="pl-4 border-l border-border/40">
            <div className="text-xs text-muted-foreground">Floating Return</div>
            <div className={`text-sm font-bold font-mono flex items-center gap-1 ${totalReturnAmount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {totalReturnAmount >= 0 ? "+" : ""}Rp {totalReturnAmount.toLocaleString("id-ID")} ({totalReturnPct.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Investment Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {investmentSummaries.map(({ inv, currentQty, unitPrice, marketValue, returnAmount, returnPct }) => (
          <Card key={inv.id} className="relative overflow-hidden border-border/60">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">{inv.asset_name}</CardTitle>
                <CardDescription className="capitalize">Kategori: {inv.asset_type}</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs uppercase">
                {inv.unit}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                <div>
                  <div className="text-muted-foreground">Total Kepemilikan</div>
                  <div className="font-bold text-sm font-mono">{currentQty} {inv.unit}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Harga Pasar Saat Ini</div>
                  <div className="font-bold text-sm font-mono">Rp {unitPrice.toLocaleString("id-ID")}</div>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-muted-foreground">Nilai Pasar (Market Value)</div>
                  <div className="text-lg font-bold font-mono">Rp {marketValue.toLocaleString("id-ID")}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground">Floating PnL</div>
                  <div className={`text-xs font-bold font-mono ${returnAmount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {returnAmount >= 0 ? "+" : ""}Rp {returnAmount.toLocaleString("id-ID")} ({returnPct.toFixed(1)}%)
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1"
                      onClick={() => {
                        setSelectedInvForVal(inv.id);
                        setNewValuationPrice(unitPrice.toString());
                      }}
                    >
                      <PencilSimpleIcon className="size-3" /> Update Harga
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <form onSubmit={handleUpdateValuation}>
                      <DialogHeader>
                        <DialogTitle>Update Harga Pasar — {inv.asset_name}</DialogTitle>
                        <DialogDescription>
                          Masukkan estimasi harga pasar terkini per unit ({inv.unit}).
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Harga per {inv.unit} (Rp)</Label>
                          <Input
                            type="number"
                            value={newValuationPrice}
                            onChange={(e) => setNewValuationPrice(e.target.value)}
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
                      className="flex-1 text-xs gap-1"
                      onClick={() => {
                        setSelectedInvForTx(inv.id);
                        setInvTxPrice(unitPrice.toString());
                        setInvTxWalletId(accessibleWallets[0]?.id || "");
                      }}
                    >
                      <PlusIcon className="size-3" /> Beli / Jual
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px]">
                    <form onSubmit={handleCreateInvTx}>
                      <DialogHeader>
                        <DialogTitle>Transaksi Investasi — {inv.asset_name}</DialogTitle>
                        <DialogDescription>
                          Catat transaksi beli/jual dan hubungkan dengan wallet sumber/tujuan dana.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Tipe Transaksi</Label>
                            <Select value={invTxType} onValueChange={(val: "buy" | "sell") => setInvTxType(val)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="buy">Beli (Potong Wallet)</SelectItem>
                                <SelectItem value="sell">Jual (Tambah Wallet)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label>Wallet Sumber/Tujuan</Label>
                            <Select value={invTxWalletId} onValueChange={setInvTxWalletId}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {accessibleWallets.map((w) => (
                                  <SelectItem key={w.id} value={w.id}>
                                    {w.name} (Saldo: Rp {w.balance.toLocaleString("id-ID")})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Jumlah Quantity ({inv.unit})</Label>
                            <Input
                              type="number"
                              step="any"
                              placeholder="1.5"
                              value={invTxQty}
                              onChange={(e) => setInvTxQty(e.target.value)}
                              required
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Harga per {inv.unit} (Rp)</Label>
                            <Input
                              type="number"
                              value={invTxPrice}
                              onChange={(e) => setInvTxPrice(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label>Tanggal Transaksi</Label>
                          <Input
                            type="date"
                            value={invTxDate}
                            onChange={(e) => setInvTxDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="submit">Konfirmasi Transaksi</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Investment Transactions History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Transaksi Investasi (`INVESTMENT_TRANSACTIONS`)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama Aset</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Wallet Terkait</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Harga Unit</TableHead>
                <TableHead className="text-right">Total Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.investmentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Belum ada riwayat transaksi investasi.
                  </TableCell>
                </TableRow>
              ) : (
                store.investmentTransactions.map((itx) => {
                  const inv = store.investments.find((i) => i.id === itx.investment_id);
                  const wallet = store.wallets.find((w) => w.id === itx.wallet_id);
                  const total = itx.quantity * itx.price;

                  return (
                    <TableRow key={itx.id}>
                      <TableCell className="font-mono text-xs">{itx.date}</TableCell>
                      <TableCell className="font-medium text-xs">{inv?.asset_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={itx.type === "buy" ? "default" : "secondary"} className="text-[10px] uppercase">
                          {itx.type === "buy" ? "BELI" : "JUAL"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{wallet?.name || "-"}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{itx.quantity} {inv?.unit}</TableCell>
                      <TableCell className="text-right font-mono text-xs">Rp {itx.price.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-semibold font-mono text-sm">
                        Rp {total.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
