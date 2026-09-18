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
import * as budgetsService from "@/services/budgets.service";
import * as reservationsService from "@/services/reservations.service";
import * as categoriesService from "@/services/categories.service";
import * as walletsService from "@/services/wallets.service";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatRupiah } from "@/libs/number";
import type { Budget, BudgetPeriod, AllocationMethod, Category, Wallet } from "@/types";

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetToEdit?: Budget | null;
  onSaved?: () => void;
}

interface ReservationInput {
  wallet_id: string;
  reserved_amount: number;
  allocation_method: AllocationMethod;
  percentage?: number;
}

function BudgetFormDialogContent({
  budgetToEdit,
  onClose,
  onSaved,
}: {
  budgetToEdit?: Budget | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");

  const [name, setName] = useState(() => budgetToEdit?.name || "");
  const [categoryId, setCategoryId] = useState(() => budgetToEdit?.category_id || "");
  const [targetAmount, setTargetAmount] = useState(() => budgetToEdit?.target_amount.toString() || "");
  const [period, setPeriod] = useState<BudgetPeriod>(() => budgetToEdit?.period || "monthly");
  const [ownerType, setOwnerType] = useState<"user" | "household">(() => (budgetToEdit?.owner_user_id ? "user" : "household"));
  const [reservations, setReservations] = useState<ReservationInput[]>([]);
  const [existingReservationIds, setExistingReservationIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setIsLoadingData(true);
      try {
        const [walletList, categoryList] = await Promise.all([
          walletsService.listWallets(),
          categoriesService.listCategories(),
        ]);
        setWallets(walletList);
        setCategories(categoryList);

        if (!categoryId && categoryList.length > 0) {
          const firstExpense = categoryList.find((c) => c.type === "expense" || c.type === "both");
          setCategoryId(firstExpense?.id || "");
        }

        if (budgetToEdit) {
          const existing = await budgetsService.listBudgetReservations(budgetToEdit.id);
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
        toast.error("Gagal memuat data wallet/kategori.");
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
    if (!name.trim() || !categoryId || !targetAmount) return;

    const targetVal = parseFloat(targetAmount) || 0;
    setIsSubmitting(true);

    try {
      let budgetId: string;

      if (budgetToEdit) {
        await budgetsService.updateBudget(budgetToEdit.id, {
          name: name.trim(),
          category_id: categoryId,
          target_amount: targetVal,
          period,
        });
        budgetId = budgetToEdit.id;

        await Promise.all(
          existingReservationIds.map((id) => reservationsService.deleteReservation(id))
        );
      } else {
        const created = await budgetsService.createBudget({
          owner_type: ownerType,
          name: name.trim(),
          category_id: categoryId,
          target_amount: targetVal,
          period,
        });
        budgetId = created.id;
      }

      await Promise.all(
        reservations
          .filter((r) => r.reserved_amount > 0)
          .map((r) =>
            reservationsService.createReservation({
              wallet_id: r.wallet_id,
              budget_id: budgetId,
              reserved_amount: r.reserved_amount,
              allocation_method: r.allocation_method,
              allocation_config:
                r.allocation_method === "percentage" ? { percentage: r.percentage || 0 } : undefined,
            })
          )
      );

      toast.success(budgetToEdit ? "Budget berhasil diperbarui!" : "Budget berhasil dibuat!");
      onSaved?.();
      onClose();
    } catch (err) {
      const description =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error("Gagal menyimpan budget", { description });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalReservedInForm = reservations.reduce((sum, r) => sum + (r.reserved_amount || 0), 0);

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          {budgetToEdit ? "Edit Budget Berulang" : "Buat Budget Berulang Baru"}
        </DialogTitle>
        <DialogDescription>
          Budget berulang terikat ke satu kategori pengeluaran dan targetnya dihitung per periode.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Nama & Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bud-name">Nama Budget *</Label>
            <Input
              id="bud-name"
              placeholder="Misal: Budget Kuliner & Resto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bud-cat">Kategori Terikat *</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger id="bud-cat">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Target Nominal & Periode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bud-target">Target Nominal per Periode *</Label>
            <CurrencyInput
              id="bud-target"
              placeholder="3.500.000"
              value={targetAmount}
              onValueChange={(num) => setTargetAmount(num.toString())}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bud-period">Periode Reset *</Label>
            <Select value={period} onValueChange={(val) => setPeriod(val as BudgetPeriod)}>
              <SelectTrigger id="bud-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Mingguan</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="yearly">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Owner Type */}
        {!budgetToEdit && (
          <div className="space-y-2">
            <Label>Kepemilikan Budget</Label>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="owner"
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
                  name="owner"
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
                Alokasikan nominal reservasi yang "dikunci" di setiap dompet penampung.
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
          {budgetToEdit ? "Simpan Perubahan" : "Buat Budget"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  budgetToEdit,
  onSaved,
}: BudgetFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl bg-card border-border">
        {open && (
          <BudgetFormDialogContent
            key={budgetToEdit ? budgetToEdit.id : "new-budget"}
            budgetToEdit={budgetToEdit}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
