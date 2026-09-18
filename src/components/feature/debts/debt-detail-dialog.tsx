import React from "react";
import { type Debt, type DebtPayment, type Wallet } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import {
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersThreeIcon,
  WalletIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ReceiptIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

interface DebtDetailDialogProps {
  debt: Debt | null;
  payments: DebtPayment[];
  wallets: Wallet[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayClick: (debtId: string) => void;
  onEditClick: (debt: Debt) => void;
  onDeleteClick: (debtId: string) => void;
  canEdit: boolean;
}

export const DebtDetailDialog: React.FC<DebtDetailDialogProps> = ({
  debt,
  payments,
  wallets,
  open,
  onOpenChange,
  onPayClick,
  onEditClick,
  onDeleteClick,
  canEdit,
}) => {
  if (!debt) return null;

  const activePayments = payments.filter((p) => p.status === "active");

  const totalPaid = activePayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, debt.principal - totalPaid);
  const progressPercent = Math.min(100, Math.round((totalPaid / debt.principal) * 100));

  const dueDateObj = new Date(debt.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDateObj.setHours(0, 0, 0, 0);

  const diffTime = dueDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0 && debt.status !== "paid" && debt.status !== "cancelled";

  const hasPortion = Boolean(debt.portion_admin || debt.portion_member);
  const portionAdmin = debt.portion_admin ?? debt.principal / 2;
  const portionMember = debt.portion_member ?? debt.principal / 2;
  const adminRatio = debt.principal > 0 ? portionAdmin / debt.principal : 0.5;
  const memberRatio = debt.principal > 0 ? portionMember / debt.principal : 0.5;

  const remainingAdmin = Math.round(remaining * adminRatio);
  const remainingMember = Math.round(remaining * memberRatio);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border border-border/80 shadow-2xl">
        {/* Top Header Banner */}
        <div className="p-6 pb-4 bg-gradient-to-br from-card via-background to-muted/40 border-b border-border/60">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={
                    debt.type === "utang"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  }
                >
                  {debt.type === "utang" ? (
                    <ArrowUpRightIcon className="size-3.5 mr-1" />
                  ) : (
                    <ArrowDownLeftIcon className="size-3.5 mr-1" />
                  )}
                  {debt.type === "utang" ? "Utang Kami (Kewajiban)" : "Piutang Kami (Tagihan)"}
                </Badge>

                {debt.status === "paid" && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium">
                    <CheckCircleIcon className="size-3.5 mr-1" /> Lunas
                  </Badge>
                )}
                {debt.status === "partial" && (
                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium">
                    <ClockIcon className="size-3.5 mr-1" /> Cicilan Aktif
                  </Badge>
                )}
                {debt.status === "active" && (
                  <Badge variant="secondary" className="font-medium">
                    Belum Lunas
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight pt-1">
                {debt.counterparty}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3.5" />
                  Jatuh Tempo:{" "}
                  <strong className={isOverdue ? "text-rose-500 font-semibold" : "text-foreground font-medium"}>
                    {debt.due_date}
                  </strong>
                </span>
              </DialogDescription>
            </div>

            {canEdit && (
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1"
                  onClick={() => {
                    onOpenChange(false);
                    onEditClick(debt);
                  }}
                >
                  <PencilIcon className="size-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-200 dark:border-rose-900/50"
                  onClick={() => {
                    onOpenChange(false);
                    onDeleteClick(debt.id);
                  }}
                >
                  <TrashIcon className="size-3.5" /> Hapus
                </Button>
              </div>
            )}
          </div>

          {isOverdue && (
            <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <WarningCircleIcon className="size-4 shrink-0" />
              <span>
                <strong>Perhatian!</strong> Pembayaran ini sudah melewati tenggat waktu jatuh tempo (Terlewat {Math.abs(diffDays)} hari).
              </span>
            </div>
          )}
        </div>

        {/* Content Details Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Nominal Pokok Awal</p>
              <p className="text-base font-bold tracking-tight">
                Rp {debt.principal.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Total Terbayar</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                Rp {totalPaid.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1">
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Sisa Pokok</p>
              <p className="text-base font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                Rp {remaining.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Progress Bar Section */}
          <div className="space-y-2 p-4 rounded-xl border border-border/60 bg-card/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <ReceiptIcon className="size-4 text-primary" />
                Progress Pelunasan Total
              </span>
              <span className="font-bold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2.5 rounded-full" />
            <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
              <span>{activePayments.length} transaksi pembayaran telah dicatat</span>
              <span>{progressPercent === 100 ? "LUNAS" : `Sisa Rp ${remaining.toLocaleString("id-ID")}`}</span>
            </div>
          </div>

          {/* Portion Breakdown */}
          {hasPortion && (
            <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <UsersThreeIcon className="size-4 text-indigo-500" />
                  Rincian Porsi Tanggung Jawab
                </span>
                <Badge variant="outline" className="text-[10px] px-2 py-0">Porsi Aktif</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/40 space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Porsi Admin</span>
                    <span className="font-medium">Rp {portionAdmin.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    Sisa: Rp {remainingAdmin.toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border/40 space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Porsi Member</span>
                    <span className="font-medium">Rp {portionMember.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    Sisa: Rp {remainingMember.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ReceiptIcon className="size-4 text-muted-foreground" />
                Riwayat Cicilan & Pembayaran
              </h4>
              {remaining > 0 && debt.status !== "cancelled" && (
                <Button
                  size="xs"
                  className="h-7 text-xs px-2.5 gap-1"
                  onClick={() => {
                    onOpenChange(false);
                    onPayClick(debt.id);
                  }}
                >
                  <PlusIcon className="size-3.5" /> Catat Pembayaran
                </Button>
              )}
            </div>

            <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[11px] h-8">Tanggal</TableHead>
                    <TableHead className="text-[11px] h-8">Dompet / Rekening</TableHead>
                    <TableHead className="text-[11px] h-8 text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="p-0">
                        <EmptyState
                          icon={ReceiptIcon}
                          title="Belum Ada Pembayaran"
                          description="Belum ada riwayat cicilan atau pelunasan yang dicatat untuk utang/piutang ini."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    activePayments.map((p) => {
                      const wallet = wallets.find((w) => w.id === p.wallet_id);
                      return (
                        <TableRow key={p.id} className="text-xs">
                          <TableCell className="font-medium text-foreground py-2.5">
                            {p.date}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <WalletIcon className="size-3.5 text-primary" />
                              {wallet?.name || "Dompet"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 py-2.5">
                            +Rp {p.amount.toLocaleString("id-ID")}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {debt.note && (
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 text-xs space-y-1">
              <p className="font-medium text-muted-foreground">Catatan / Keterangan:</p>
              <p className="text-foreground leading-relaxed italic">"{debt.note}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
