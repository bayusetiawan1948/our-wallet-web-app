import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, ScalesIcon, WalletIcon } from "@phosphor-icons/react";
import * as budgetsService from "@/services/budgets.service";
import * as goalsService from "@/services/goals.service";
import * as walletsService from "@/services/wallets.service";
import type { Budget, Goal, Wallet } from "@/types";

interface EncroachmentItem {
  id: string;
  transaction_id: string;
  wallet_id: string;
  amount: number;
  created_at: string;
}

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
  const [historyList, setHistoryList] = useState<EncroachmentItem[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setIsLoading(true);
    Promise.all([
      targetBudget
        ? budgetsService.listBudgetEncroachments(targetBudget.id)
        : targetGoal
          ? goalsService.listGoalEncroachments(targetGoal.id)
          : Promise.resolve([]),
      walletsService.listWallets(),
    ])
      .then(([encroachments, walletList]) => {
        setHistoryList(encroachments);
        setWallets(walletList);
      })
      .finally(() => setIsLoading(false));
  }, [open, targetBudget, targetGoal]);

  const title = targetBudget ? targetBudget.name : targetGoal ? targetGoal.name : "";
  const subtitle = targetBudget ? "Riwayat Encroachment Budget Berulang" : "Riwayat Encroachment Financial Goal";

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
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Memuat...</div>
            ) : historyList.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground text-sm space-y-1">
                <ClockIcon className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="font-medium text-foreground">Belum Ada Riwayat Encroachment</p>
                <p className="text-xs">
                  Reservasi {targetBudget ? "budget" : "goal"} ini belum pernah terserap oleh transaksi defisit.
                </p>
              </div>
            ) : (
              historyList.map((item) => {
                const wallet = wallets.find((w) => w.id === item.wallet_id);

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {new Date(item.created_at).toLocaleDateString("id-ID")}
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
