import React, { useState } from "react";
import { useMockStore } from "@/lib/mock-store";
import {
  WalletIcon,
  ScalesIcon,
  BankIcon,
  CreditCardIcon,
  MoneyIcon,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function WalletsPage() {
  const store = useMockStore();
  const accessibleWallets = store.getAccessibleWallets();

  // Reconciliation State
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState<string>("");
  const [reconcileNotes, setReconcileNotes] = useState<string>("");

  const selectedWallet = store.wallets.find((w) => w.id === selectedWalletId);
  const recordedBal = selectedWallet?.balance || 0;
  const numActual = parseFloat(actualBalanceInput) || 0;
  const diff = numActual - recordedBal;

  const handleReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletId || actualBalanceInput === "") return;

    store.reconcileWallet(selectedWalletId, numActual, reconcileNotes);
    setActualBalanceInput("");
    setReconcileNotes("");
    setSelectedWalletId(null);
  };

  return (
    <div className="py-8 px-6 sm:px-8 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/60 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <WalletIcon className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Dompet & Rekonsiliasi Saldo</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Kelola saldo bank, e-wallet, dan uang tunai keluarga serta lakukan pencocokan saldo aktual secara berkala.
          </p>
        </div>
      </div>

      {/* Accessible Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accessibleWallets.map((w) => {
          const ownerUser = store.users.find((u) => u.id === w.owner_user_id);
          return (
            <Card key={w.id} className="relative overflow-hidden border-border/60">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-base font-semibold">{w.name}</CardTitle>
                {w.type === "bank" ? (
                  <BankIcon className="size-5 text-blue-500" />
                ) : w.type === "ewallet" ? (
                  <CreditCardIcon className="size-5 text-emerald-500" />
                ) : (
                  <MoneyIcon className="size-5 text-amber-500" />
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Saldo Catatan</div>
                  <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                    Rp {w.balance.toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {ownerUser ? `Milik ${ownerUser.name}` : "Kantong Bersama"}
                  </Badge>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary"
                        onClick={() => {
                          setSelectedWalletId(w.id);
                          setActualBalanceInput(w.balance.toString());
                        }}
                      >
                        <ScalesIcon className="size-3" />
                        Rekonsiliasi
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <form onSubmit={handleReconcile}>
                        <DialogHeader>
                          <DialogTitle>Rekonsiliasi Saldo — {w.name}</DialogTitle>
                          <DialogDescription>
                            Pencocokan saldo tercatat di aplikasi dengan saldo fisik/mutasi aktual.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                          <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                            <div className="text-muted-foreground">Saldo Tercatat Sekarang:</div>
                            <div className="text-base font-bold font-mono">
                              Rp {w.balance.toLocaleString("id-ID")}
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label>Saldo Aktual Fisik (Rp)</Label>
                            <Input
                              type="number"
                              value={actualBalanceInput}
                              onChange={(e) => setActualBalanceInput(e.target.value)}
                              required
                            />
                          </div>

                          <div className="p-3 border rounded-lg text-xs space-y-1 bg-accent/20">
                            <div className="text-muted-foreground">Selisih Koreksi Saldo:</div>
                            <div className={`font-mono font-bold text-sm ${diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {diff >= 0 ? "+" : ""} Rp {diff.toLocaleString("id-ID")}
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label>Catatan Rekonsiliasi</Label>
                            <Input
                              placeholder="Koreksi karena penyesuaian bunga / admin bank..."
                              value={reconcileNotes}
                              onChange={(e) => setReconcileNotes(e.target.value)}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button type="submit">Simpan Rekonsiliasi</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reconciliation History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Rekonsiliasi (`WALLET_RECONCILIATIONS`)</CardTitle>
          <CardDescription>
            Catatan historis audit pencocokan saldo dompet dan penyesuaian koreksi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama Wallet</TableHead>
                <TableHead className="text-right">Saldo Tercatat</TableHead>
                <TableHead className="text-right">Saldo Aktual</TableHead>
                <TableHead className="text-right">Selisih Penyesuaian</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.reconciliations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Belum ada riwayat rekonsiliasi dompet.
                  </TableCell>
                </TableRow>
              ) : (
                store.reconciliations.map((rec) => {
                  const wallet = store.wallets.find((w) => w.id === rec.wallet_id);
                  const diffVal = rec.actual_balance - rec.recorded_balance;

                  return (
                    <TableRow key={rec.id}>
                      <TableCell className="font-mono text-xs">{rec.date}</TableCell>
                      <TableCell className="font-medium text-xs">{wallet?.name || "-"}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        Rp {rec.recorded_balance.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        Rp {rec.actual_balance.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-xs font-bold ${diffVal >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {diffVal >= 0 ? "+" : ""} Rp {diffVal.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-xs">{rec.notes || "-"}</TableCell>
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
