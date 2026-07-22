import React, { useState } from "react";
import { useMockStore } from "@/lib/mock-store";
import {
  HandshakeIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  WalletIcon,
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
import { Progress } from "@/components/ui/progress";

export default function DebtsReceivablesPage() {
  const store = useMockStore();
  const accessibleWallets = store.getAccessibleWallets();

  // Debt Payment Modal State
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [payWalletId, setPayWalletId] = useState<string>(accessibleWallets[0]?.id || "");
  const [payAmount, setPayAmount] = useState<string>("");
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const handlePayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtId || !payWalletId || !payAmount) return;

    const amount = parseFloat(payAmount) || 0;
    const success = store.addDebtPayment(selectedDebtId, payWalletId, amount, payDate);

    if (success) {
      setPayAmount("");
      setSelectedDebtId(null);
    }
  };

  return (
    <div className="py-8 px-6 sm:px-8 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/60 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HandshakeIcon className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Utang & Piutang</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Lacak pokok kewajiban & tagihan keluarga, porsi tanggung jawab (Bayu vs Annisa), serta pembayaran via wallet terotorisasi.
          </p>
        </div>
      </div>

      {/* Debts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Utang & Piutang Active</CardTitle>
          <CardDescription>
            Pencatatan utang (kewajiban bayar) dan piutang (kewajiban orang lain membalas dana) dengan split porsi Admin & Member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipe</TableHead>
                <TableHead>Pihak Kedua (Counterparty)</TableHead>
                <TableHead>Porsi Admin (Bayu)</TableHead>
                <TableHead>Porsi Member (Annisa)</TableHead>
                <TableHead className="text-right">Pokok Awal</TableHead>
                <TableHead className="text-right">Telah Dibayar</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.debts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                    Belum ada pencatatan utang atau piutang.
                  </TableCell>
                </TableRow>
              ) : (
                store.debts.map((debt) => {
                  const paidTotal = store.debtPayments
                    .filter((p) => p.debt_id === debt.id && p.status === "active")
                    .reduce((sum, p) => sum + p.amount, 0);

                  const progressPct = Math.min(100, Math.round((paidTotal / debt.principal) * 100));
                  const isUtang = debt.type === "utang";
                  const isLunas = debt.status === "lunas";

                  return (
                    <TableRow key={debt.id}>
                      <TableCell>
                        <Badge
                          variant={isUtang ? "destructive" : "default"}
                          className={`gap-1 text-[11px] ${
                            isUtang ? "bg-rose-500/15 text-rose-600 border-rose-500/30" : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                          }`}
                        >
                          {isUtang ? (
                            <>
                              <ArrowUpRightIcon className="size-3" /> Utang Kami
                            </>
                          ) : (
                            <>
                              <ArrowDownLeftIcon className="size-3" /> Piutang Kami
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {debt.counterparty}
                        {debt.note && <div className="text-xs text-muted-foreground">{debt.note}</div>}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        Rp {debt.portion_admin.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        Rp {debt.portion_member.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm font-mono">
                        Rp {debt.principal.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <div className="font-medium text-emerald-600">Rp {paidTotal.toLocaleString("id-ID")}</div>
                        <Progress value={progressPct} className="h-1.5 mt-1" />
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{debt.due_date}</TableCell>
                      <TableCell className="text-center">
                        {isLunas ? (
                          <Badge className="bg-emerald-500 text-white gap-1 text-[10px]">
                            <CheckCircleIcon className="size-3" /> LUNAS
                          </Badge>
                        ) : debt.status === "cicilan" ? (
                          <Badge variant="secondary" className="gap-1 text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                            <ClockIcon className="size-3" /> CICILAN ({progressPct}%)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10">
                            BELUM DIBAYAR
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {!isLunas && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  setSelectedDebtId(debt.id);
                                  setPayWalletId(accessibleWallets[0]?.id || "");
                                }}
                              >
                                <WalletIcon className="size-3" />
                                {isUtang ? "Bayar / Cicil" : "Terima Cicilan"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <form onSubmit={handlePayDebt}>
                                <DialogHeader>
                                  <DialogTitle>
                                    {isUtang ? "Catat Pembayaran Utang" : "Catat Penerimaan Piutang"}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Pilih wallet milik Anda yang akan {isUtang ? "dipotong" : "bertambah"} saldonya.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                  <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                                    <div className="font-semibold text-sm">{debt.counterparty}</div>
                                    <div>Sisa Pokok: Rp {(debt.principal - paidTotal).toLocaleString("id-ID")}</div>
                                  </div>

                                  <div className="grid gap-2">
                                    <Label>Pilih Wallet (Terotorisasi)</Label>
                                    <Select value={payWalletId} onValueChange={setPayWalletId}>
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
                                    {store.activeRole === "member" && (
                                      <p className="text-[11px] text-muted-foreground">
                                        * Sebagai Member, Anda hanya dapat memotong/menambah saldo dari wallet yang di-assign pada Anda.
                                      </p>
                                    )}
                                  </div>

                                  <div className="grid gap-2">
                                    <Label>Jumlah Nominal (Rp)</Label>
                                    <Input
                                      type="number"
                                      placeholder="Contoh: 1000000"
                                      value={payAmount}
                                      onChange={(e) => setPayAmount(e.target.value)}
                                      required
                                    />
                                  </div>

                                  <div className="grid gap-2">
                                    <Label>Tanggal Pembayaran</Label>
                                    <Input
                                      type="date"
                                      value={payDate}
                                      onChange={(e) => setPayDate(e.target.value)}
                                      required
                                    />
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button type="submit">Konfirmasi Pembayaran</Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
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

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Cicilan & Pelunasan (`DEBT_PAYMENTS`)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Utang / Piutang</TableHead>
                <TableHead>Wallet Terpotong/Bertambah</TableHead>
                <TableHead>Diinput Oleh</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.debtPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Belum ada riwayat cicilan.
                  </TableCell>
                </TableRow>
              ) : (
                store.debtPayments.map((dp) => {
                  const debt = store.debts.find((d) => d.id === dp.debt_id);
                  const wallet = store.wallets.find((w) => w.id === dp.wallet_id);
                  const recorder = store.users.find((u) => u.id === dp.recorded_by);

                  return (
                    <TableRow key={dp.id}>
                      <TableCell className="font-mono text-xs">{dp.date}</TableCell>
                      <TableCell className="font-medium text-xs">{debt?.counterparty || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{wallet?.name || "-"}</TableCell>
                      <TableCell className="text-xs">{recorder?.name || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-sm font-mono text-emerald-600">
                        Rp {dp.amount.toLocaleString("id-ID")}
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
