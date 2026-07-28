import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, ScalesIcon, WalletIcon } from "@phosphor-icons/react";
import { useMockStore } from "@/lib/mock-store";
import type { Budget, Goal } from "@/types";

interface EncroachmentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetBudget?: Budget | null;
  targetGoal?: Goal | null;
}

export function EncroachmentHistoryDialog({
  open,
  onOpenChange,
  targetBudget,
  targetGoal,
}: EncroachmentHistoryDialogProps) {
  const store = useMockStore();

  const title = targetBudget ? targetBudget.name : targetGoal ? targetGoal.name : "";
  const subtitle = targetBudget ? "Riwayat Encroachment Budget Berulang" : "Riwayat Encroachment Financial Goal";

  const historyList = store.encroachments.filter((enc) => {
    if (targetBudget && enc.budget_id === targetBudget.id) return true;
    if (targetGoal && enc.goal_id === targetGoal.id) return true;
    return false;
  });

  const totalEncroached = historyList.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ScalesIcon className="w-5 h-5" />
            <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {subtitle} — Jejak penyerapan saldo reservasi akibat defisit saldo bebas transaksi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary Box */}
          <div className="p-3.5 rounded-lg border bg-muted/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Total Encroachment Terserap:
            </span>
            <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
              Rp {totalEncroached.toLocaleString("id-ID")}
            </span>
          </div>

          {/* History List */}
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {historyList.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground text-sm space-y-1">
                <ClockIcon className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="font-medium text-foreground">Belum Ada Riwayat Encroachment</p>
                <p className="text-xs">
                  Reservasi {targetBudget ? "budget" : "goal"} ini belum pernah terserap oleh transaksi defisit.
                </p>
              </div>
            ) : (
              historyList.map((item) => {
                const wallet = store.wallets.find((w) => w.id === item.wallet_id);
                const tx = store.transactions.find((t) => t.id === item.transaction_id);

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {item.created_at}
                        </Badge>
                        {wallet && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <WalletIcon className="w-3.5 h-3.5" />
                            <span>{wallet.name}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-mono font-bold text-destructive">
                        - Rp {item.amount.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {tx && (
                      <p className="text-xs text-foreground font-medium">
                        Dari Transaksi: "{tx.note || "Pengeluaran"}" (Total Tx: Rp {tx.amount.toLocaleString("id-ID")})
                      </p>
                    )}

                    {item.note && (
                      <p className="text-[11px] text-muted-foreground italic">
                        {item.note}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
