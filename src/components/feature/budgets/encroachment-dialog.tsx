import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  WarningIcon,
  CheckCircleIcon,
  ScalesIcon,
  WalletIcon,
  TargetIcon,
} from "@phosphor-icons/react";
import type { Wallet, Reservation, Budget, Goal } from "@/types";

interface EncroachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortfall: number;
  wallet: Wallet | null;
  reservations: Reservation[];
  budgets: Budget[];
  goals: Goal[];
  onConfirm: (allocations: Array<{ budget_id?: string; goal_id?: string; amount: number }>) => void;
}

function EncroachmentDialogContent({
  shortfall,
  wallet,
  reservations,
  budgets,
  goals,
  onConfirm,
  onClose,
}: {
  shortfall: number;
  wallet: Wallet;
  reservations: Reservation[];
  budgets: Budget[];
  goals: Goal[];
  onConfirm: (allocations: Array<{ budget_id?: string; goal_id?: string; amount: number }>) => void;
  onClose: () => void;
}) {
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    if (reservations.length === 1) {
      return { [reservations[0].id]: shortfall };
    }
    const initial: Record<string, number> = {};
    reservations.forEach((r) => {
      initial[r.id] = 0;
    });
    return initial;
  });

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0);
  const remainingShortfall = shortfall - totalAllocated;
  const isValid = Math.abs(remainingShortfall) === 0 && totalAllocated > 0;

  const handleInputChange = (reservationId: string, value: string) => {
    const numeric = parseFloat(value) || 0;
    setAllocations((prev) => ({
      ...prev,
      [reservationId]: numeric,
    }));
  };

  const handleQuickFill = (reservationId: string) => {
    const currentOthers = Object.entries(allocations)
      .filter(([id]) => id !== reservationId)
      .reduce((sum, [, val]) => sum + (val || 0), 0);
    const needed = Math.max(0, shortfall - currentOthers);
    setAllocations((prev) => ({
      ...prev,
      [reservationId]: needed,
    }));
  };

  const handleSubmit = () => {
    if (!isValid) return;

    const resultList: Array<{ budget_id?: string; goal_id?: string; amount: number }> = [];
    reservations.forEach((r) => {
      const amt = allocations[r.id] || 0;
      if (amt > 0) {
        resultList.push({
          budget_id: r.budget_id || undefined,
          goal_id: r.goal_id || undefined,
          amount: amt,
        });
      }
    });

    onConfirm(resultList);
  };

  return (
    <>
      <DialogHeader className="space-y-2">
        <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
          <WarningIcon className="w-6 h-6 animate-pulse" />
          <DialogTitle className="text-xl font-bold tracking-tight">
            Atribusi Wajib Encroachment Saldo Bebas
          </DialogTitle>
        </div>
        <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
          Pengeluaran ini menyebabkan Saldo Bebas dompet <strong>{wallet.name}</strong> menjadi minus. Anda wajib memilih Budget atau Goal penampung untuk menyerap defisit tersebut.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Box Highlight Defisit */}
        <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200">
          <ScalesIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold text-base">
            Defisit Saldo Bebas: Rp {shortfall.toLocaleString("id-ID")}
          </AlertTitle>
          <AlertDescription className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            Pilih satu atau lebih reservasi di bawah dan alokasikan total split nominal hingga pas Rp {shortfall.toLocaleString("id-ID")}.
          </AlertDescription>
        </Alert>

        {/* List Reservasi Wallet */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reservasi Terikat di Dompet {wallet.name} ({reservations.length})
          </Label>

          {reservations.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
              Tidak ada reservasi budget/goal di dompet ini. Mohon tambahkan reservasi pada halaman Budget & Goal terlebih dahulu.
            </div>
          ) : (
            reservations.map((res) => {
              const budget = res.budget_id ? budgets.find((b) => b.id === res.budget_id) : null;
              const goal = res.goal_id ? goals.find((g) => g.id === res.goal_id) : null;
              const name = budget ? budget.name : goal ? goal.name : "Reservasi Dompet";
              const typeLabel = budget ? "Budget Berulang" : "Financial Goal";

              return (
                <div
                  key={res.id}
                  className="p-3.5 rounded-lg border border-border bg-card/60 hover:bg-card transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {budget ? (
                        <TargetIcon className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <WalletIcon className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="font-medium text-sm text-foreground">{name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {typeLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sisa Reservasi Saat Ini:{" "}
                      <strong className="text-foreground font-mono">
                        Rp {res.reserved_amount.toLocaleString("id-ID")}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:w-48">
                    <div className="relative w-full">
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">
                        Rp
                      </span>
                      <Input
                        type="number"
                        value={allocations[res.id] || ""}
                        onChange={(e) => handleInputChange(res.id, e.target.value)}
                        placeholder="0"
                        className="pl-8 text-right font-mono text-sm h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => handleQuickFill(res.id)}
                      className="text-[11px] whitespace-nowrap h-9 px-2.5"
                    >
                      Pas-kan
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Validation Bar */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2">
            {isValid ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
            ) : (
              <WarningIcon className="w-5 h-5 text-destructive animate-bounce" />
            )}
            <span className="text-xs font-medium">
              {isValid
                ? "Atribusi Encroachment Pas 100%!"
                : remainingShortfall > 0
                ? `Sisa Kekurangan: Rp ${remainingShortfall.toLocaleString("id-ID")}`
                : `Kelebihan Alokasi: Rp ${Math.abs(remainingShortfall).toLocaleString("id-ID")}`}
            </span>
          </div>
          <span className="text-xs font-mono font-semibold">
            Total Alokasi: Rp {totalAllocated.toLocaleString("id-ID")} / Rp {shortfall.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" type="button" onClick={onClose}>
          Batal
        </Button>
        <Button
          type="button"
          disabled={!isValid}
          onClick={handleSubmit}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2"
        >
          <CheckCircleIcon className="w-4 h-4" />
          Simpan Atribusi Encroachment
        </Button>
      </DialogFooter>
    </>
  );
}

export function EncroachmentDialog({
  open,
  onOpenChange,
  shortfall,
  wallet,
  reservations,
  budgets,
  goals,
  onConfirm,
}: EncroachmentDialogProps) {
  if (!wallet) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl bg-card border-border shadow-2xl">
        {open && (
          <EncroachmentDialogContent
            key={`${wallet.id}-${shortfall}`}
            shortfall={shortfall}
            wallet={wallet}
            reservations={reservations}
            budgets={budgets}
            goals={goals}
            onConfirm={onConfirm}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
