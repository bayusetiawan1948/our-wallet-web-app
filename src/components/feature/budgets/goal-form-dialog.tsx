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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useMockStore } from "@/lib/mock-store";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatRupiah } from "@/libs/number";
import type { Goal, GoalStatus, AllocationMethod } from "@/types";


interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalToEdit?: Goal | null;
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
}: {
  goalToEdit?: Goal | null;
  onClose: () => void;
}) {
  const store = useMockStore();
  const activeWallets = store.getAccessibleWallets();

  const [name, setName] = useState(() => goalToEdit?.name || "");
  const [targetAmount, setTargetAmount] = useState(() => goalToEdit?.target_amount.toString() || "");
  const [targetDate, setTargetDate] = useState(() => goalToEdit?.target_date || "");
  const [status, setStatus] = useState<GoalStatus>(() => goalToEdit?.status || "active");
  const [notes, setNotes] = useState(() => goalToEdit?.notes || "");
  const [ownerType, setOwnerType] = useState<"user" | "household">(() => (goalToEdit?.owner_user_id ? "user" : "household"));

  const [reservations, setReservations] = useState<ReservationInput[]>(() => {
    if (goalToEdit) {
      const existingRes = store.reservations.filter((r) => r.goal_id === goalToEdit.id);
      return existingRes.map((r) => ({
        wallet_id: r.wallet_id,
        reserved_amount: r.reserved_amount,
        allocation_method: r.allocation_method,
        percentage: r.allocation_config?.percentage || 0,
      }));
    }
    if (activeWallets.length > 0) {
      return [
        {
          wallet_id: activeWallets[0].id,
          reserved_amount: 0,
          allocation_method: "manual",
        },
      ];
    }
    return [];
  });

  const handleAddReservationRow = () => {
    const unselectedWallet = activeWallets.find(
      (w) => !reservations.some((r) => r.wallet_id === w.id)
    );
    const walletId = unselectedWallet ? unselectedWallet.id : activeWallets[0]?.id || "";
    setReservations((prev) => [
      ...prev,
      {
        wallet_id: walletId,
        reserved_amount: 0,
        allocation_method: "manual",
      },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    const targetVal = parseFloat(targetAmount) || 0;
    const formattedReservations = reservations.map((r) => ({
      wallet_id: r.wallet_id,
      reserved_amount: r.reserved_amount || 0,
      allocation_method: r.allocation_method,
      allocation_config: r.allocation_method === "percentage" ? { percentage: r.percentage || 0 } : undefined,
    }));

    if (goalToEdit) {
      store.updateGoal(goalToEdit.id, {
        name: name.trim(),
        target_amount: targetVal,
        target_date: targetDate || undefined,
        status,
        notes,
        reservations: formattedReservations,
      });
    } else {
      store.addGoal({
        name: name.trim(),
        target_amount: targetVal,
        target_date: targetDate || undefined,
        notes,
        ownerType,
        reservations: formattedReservations,
      });
    }

    onClose();
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
        </div>

        {/* Catatan */}
        <div className="space-y-2">
          <Label htmlFor="goal-notes">Catatan & Deskripsi</Label>
          <Textarea
            id="goal-notes"
            placeholder="Catatan mengenai tujuan finansial ini..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-20"
          />
        </div>

        {/* Owner Type */}
        <div className="space-y-2">
          <Label>Kepemilikan Goal</Label>
          <div className="flex items-center gap-4">
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
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="goal-owner"
                checked={ownerType === "user"}
                onChange={() => setOwnerType("user")}
                className="accent-primary"
              />
              <span>Pribadi ({store.getActiveUser().name})</span>
            </label>
          </div>
        </div>

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
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Tambah Dompet
            </Button>
          </div>

          {reservations.map((res, index) => {
            const walletBreakdown = store.getWalletBalanceBreakdown(res.wallet_id);
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
                        {activeWallets.map((w) => (
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

                {walletBreakdown.wallet && (
                  <div className="text-[11px] text-muted-foreground font-mono flex items-center justify-between px-1">
                    <span>Saldo Total: {formatRupiah(walletBreakdown.totalBalance)}</span>
                    <span>Saldo Bebas Sekarang: {formatRupiah(walletBreakdown.freeBalance)}</span>
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
        <Button type="submit" className="bg-primary text-primary-foreground font-medium">
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
}: GoalFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl bg-card border-border">
        {open && (
          <GoalFormDialogContent
            key={goalToEdit ? goalToEdit.id : "new-goal"}
            goalToEdit={goalToEdit}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
