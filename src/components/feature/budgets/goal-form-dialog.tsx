import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/auth-context";
import * as goalsService from "@/services/goals.service";
import * as reservationsService from "@/services/reservations.service";
import * as walletsService from "@/services/wallets.service";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatRupiah } from "@/libs/number";
import type { Goal, GoalStatus, AllocationMethod, Wallet } from "@/types";

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalToEdit?: Goal | null;
  onSaved?: () => void;
}

interface ReservationInput {
  wallet_id: string;
  reserved_amount: number;
  allocation_method: AllocationMethod;
  percentage?: number;
}

function GoalFormDialogContent({
  goalToEdit,
  onClose,
  onSaved,
}: {
  goalToEdit?: Goal | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(() => goalToEdit?.name || "");
  const [targetAmount, setTargetAmount] = useState(() => goalToEdit?.target_amount.toString() || "");
  const [targetDate, setTargetDate] = useState(() => goalToEdit?.target_date || "");
  const [status, setStatus] = useState<GoalStatus>(() => goalToEdit?.status || "active");
  const [ownerType, setOwnerType] = useState<"user" | "household">(() => (goalToEdit?.owner_user_id ? "user" : "household"));
  const [reservations, setReservations] = useState<ReservationInput[]>([]);
  const [existingReservationIds, setExistingReservationIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setIsLoadingData(true);
      try {
        const walletList = await walletsService.listWallets();
        setWallets(walletList);

        if (goalToEdit) {
          const existing = await goalsService.listGoalReservations(goalToEdit.id);
          setExistingReservationIds(existing.map((r) => r.id));
          setReservations(
            existing.map((r) => ({
              wallet_id: r.wallet_id,
              reserved_amount: r.reserved_amount,
              allocation_method: r.allocation_method as AllocationMethod,
              percentage: (r.allocation_config as { percentage?: number } | null)?.percentage || 0,
            }))
          );
        } else if (walletList.length > 0) {
          setReservations([
            { wallet_id: walletList[0].id, reserved_amount: 0, allocation_method: "manual" },
          ]);
        }
      } catch {
        toast.error("Gagal memuat data wallet.");
      } finally {
        setIsLoadingData(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, []);

  const handleAddReservationRow = () => {
    const unselectedWallet = wallets.find(
      (w) => !reservations.some((r) => r.wallet_id === w.id)
    );
    const walletId = unselectedWallet ? unselectedWallet.id : wallets[0]?.id || "";
    setReservations((prev) => [
      ...prev,
      { wallet_id: walletId, reserved_amount: 0, allocation_method: "manual" },
    ]);
  };

  const handleRemoveReservationRow = (index: number) => {
    setReservations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReservationChange = (
    index: number,
    field: keyof ReservationInput,
    value: string | number
  ) => {
    setReservations((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    const targetVal = parseFloat(targetAmount) || 0;
    setIsSubmitting(true);

    try {
      let goalId: string;

      if (goalToEdit) {
        await goalsService.updateGoal(goalToEdit.id, {
          name: name.trim(),
          target_amount: targetVal,
          target_date: targetDate || undefined,
          status,
        });
        goalId = goalToEdit.id;

        await Promise.all(
          existingReservationIds.map((id) => reservationsService.deleteReservation(id))
        );
      } else {
        const created = await goalsService.createGoal({
          owner_type: ownerType,
          name: name.trim(),
          target_amount: targetVal,
          target_date: targetDate || undefined,
        });
        goalId = created.id;
      }

      await Promise.all(
        reservations
          .filter((r) => r.reserved_amount > 0)
          .map((r) =>
            reservationsService.createReservation({
              wallet_id: r.wallet_id,
              goal_id: goalId,
              reserved_amount: r.reserved_amount,
              allocation_method: r.allocation_method,
              allocation_config:
                r.allocation_method === "percentage" ? { percentage: r.percentage || 0 } : undefined,
            })
          )
      );

      toast.success(goalToEdit ? "Goal berhasil diperbarui!" : "Goal berhasil dibuat!");
      onSaved?.();
      onClose();
    } catch (err) {
      const description =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error("Gagal menyimpan goal", { description });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalReservedInForm = reservations.reduce((sum, r) => sum + (r.reserved_amount || 0), 0);

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          {goalToEdit ? "Edit Financial Goal" : "Buat Financial Goal Baru"}
        </DialogTitle>
        <DialogDescription>
          Goal akumulatif mengumpulkan dana ke target tertentu tanpa reset periodik.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Nama & Target Nominal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nama Financial Goal *</Label>
            <Input
              id="goal-name"
              placeholder="Misal: Dana Darurat 6 Bulan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-target">Target Nominal Akumulasi *</Label>
            <CurrencyInput
              id="goal-target"
              placeholder="50.000.000"
              value={targetAmount}
              onValueChange={(num) => setTargetAmount(num.toString())}
              required
            />
          </div>
        </div>

        {/* Target Date & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="goal-date">Tanggal Target (Opsional)</Label>
            <Input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {goalToEdit && (
            <div className="space-y-2">
              <Label htmlFor="goal-status">Status Goal</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as GoalStatus)}>
                <SelectTrigger id="goal-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif Berjalan</SelectItem>
                  <SelectItem value="completed">Tercapai / Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Owner Type */}
        {!goalToEdit && (
          <div className="space-y-2">
            <Label>Kepemilikan Goal</Label>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="goal-owner"
                    checked={ownerType === "household"}
                    onChange={() => setOwnerType("household")}
                    className="accent-primary"
                  />
                  <span>Household (Gabungan Keluarga)</span>
                </label>
              )}
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="goal-owner"
                  checked={ownerType === "user"}
                  onChange={() => setOwnerType("user")}
                  className="accent-primary"
                />
                <span>Pribadi</span>
              </label>
            </div>
          </div>
        )}

        {/* Sub-Section Reservasi Dompet */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Reservasi Dompet Penampung</Label>
              <p className="text-xs text-muted-foreground">
                Alokasikan saldo dompet yang dicadangkan khusus untuk goal ini.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleAddReservationRow}
              className="gap-1 text-xs"
              disabled={isLoadingData}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Tambah Dompet
            </Button>
          </div>

          {reservations.map((res, index) => {
            const wallet = wallets.find((w) => w.id === res.wallet_id);
            return (
              <div
                key={index}
                className="p-3 rounded-lg border border-border bg-muted/20 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs text-muted-foreground">Dompet</Label>
                    <Select
                      value={res.wallet_id}
                      onValueChange={(val) => handleReservationChange(index, "wallet_id", val)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">Metode Pengisian</Label>
                    <Select
                      value={res.allocation_method}
                      onValueChange={(val) =>
                        handleReservationChange(index, "allocation_method", val as AllocationMethod)
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Nominal</SelectItem>
                        <SelectItem value="percentage">Persentase Income</SelectItem>
                        <SelectItem value="formula">Formula Preset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs text-muted-foreground">Nominal Reservasi</Label>
                    <CurrencyInput
                      value={res.reserved_amount || ""}
                      onValueChange={(num) =>
                        handleReservationChange(index, "reserved_amount", num)
                      }
                      placeholder="0"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-5 sm:pt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveReservationRow(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {wallet && (
                  <div className="text-[11px] text-muted-foreground font-mono flex items-center justify-between px-1">
                    <span>Saldo Wallet: {formatRupiah(wallet.balance)}</span>
                  </div>
                )}
              </div>
            );
          })}

          <div className="p-2.5 rounded-md bg-card border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Reservasi Terkunci:</span>
            <span className="font-mono font-bold text-foreground">
              {formatRupiah(totalReservedInForm)}
            </span>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoadingData} className="bg-primary text-primary-foreground font-medium">
          {goalToEdit ? "Simpan Perubahan" : "Buat Financial Goal"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function GoalFormDialog({
  open,
  onOpenChange,
  goalToEdit,
  onSaved,
}: GoalFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl bg-card border-border">
        {open && (
          <GoalFormDialogContent
            key={goalToEdit ? goalToEdit.id : "new-goal"}
            goalToEdit={goalToEdit}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
