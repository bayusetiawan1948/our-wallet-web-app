import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import * as debtsService from "@/services/debts.service";
import * as walletsService from "@/services/wallets.service";
import * as householdsService from "@/services/households.service";
import type { HouseholdMemberResponse } from "@/services/households.service";
import { type Debt, type DebtPayment, type DebtType, type Wallet } from "@/types";
import {
  HandshakeIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  WalletIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  UsersThreeIcon,
  EyeIcon,
} from "@phosphor-icons/react";
import { useDataControls, type FilterConfig } from "@/hooks/use-data-controls";
import { DataTableToolbar } from "@/components/common/data-table-toolbar";
import { DataPagination } from "@/components/common/data-table-pagination";
import { DebtDetailDialog } from "@/components/feature/debts/debt-detail-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { DataTableSkeleton } from "@/components/common/loading-skeleton";
import { ErrorState } from "@/components/common/error-state";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";

import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrencyInput as formatCurrencyString, parseCurrencyInput as parseCurrencyStringToNumber } from "@/libs/number";

const STATUS_LABEL: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  active: { label: "Belum Dibayar", className: "text-amber-600 border-amber-500/30 bg-amber-500/10", icon: ClockIcon },
  partial: { label: "Cicilan", className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: ClockIcon },
  paid: { label: "Lunas", className: "bg-emerald-500 text-white", icon: CheckCircleIcon },
  overdue: { label: "Jatuh Tempo", className: "bg-rose-500 text-white", icon: ClockIcon },
  cancelled: { label: "Dibatalkan", className: "bg-muted text-muted-foreground", icon: XCircleIcon },
};

export default function DebtsReceivablesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const activeUserId = user?.id ?? "";

  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [members, setMembers] = useState<HouseholdMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [debtList, walletList, memberList] = await Promise.all([
        debtsService.listDebts(),
        walletsService.listWallets(),
        householdsService.listMembers(),
      ]);
      setDebts(debtList);
      setWallets(walletList);
      setMembers(memberList);
      const paymentLists = await Promise.all(
        debtList.map((d) => debtsService.listPayments(d.id))
      );
      setPayments(paymentLists.flat());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create & Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Form Fields State
  const [formOwnerType, setFormOwnerType] = useState<"user" | "household">("user");
  const [formType, setFormType] = useState<DebtType>("utang");
  const [formCounterparty, setFormCounterparty] = useState("");
  const [formPrincipalFormatted, setFormPrincipalFormatted] = useState("");
  const [formUsePortion, setFormUsePortion] = useState(false);
  const [formPortionAdminFormatted, setFormPortionAdminFormatted] = useState("");
  const [formPortionMemberFormatted, setFormPortionMemberFormatted] = useState("");
  const [formDueDate, setFormDueDate] = useState<string>(
    () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [formNote, setFormNote] = useState("");

  // Payment Modal State
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [payWalletId, setPayWalletId] = useState<string>("");
  const [payAmountFormatted, setPayAmountFormatted] = useState<string>("");
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [isPaying, setIsPaying] = useState(false);

  // Delete Dialog State
  const [deletingDebtId, setDeletingDebtId] = useState<string | null>(null);

  // Detail Modal State
  const [detailDebt, setDetailDebt] = useState<Debt | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleOpenCreate = () => {
    setEditingDebt(null);
    setFormOwnerType("user");
    setFormType("utang");
    setFormCounterparty("");
    setFormPrincipalFormatted("");
    setFormUsePortion(false);
    setFormPortionAdminFormatted("");
    setFormPortionMemberFormatted("");
    setFormDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setFormNote("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setFormOwnerType(debt.owner_household_id ? "household" : "user");
    setFormType(debt.type);
    setFormCounterparty(debt.counterparty);
    setFormPrincipalFormatted(formatCurrencyString(debt.principal));
    const hasPortion = Boolean(debt.portion_admin || debt.portion_member);
    setFormUsePortion(hasPortion);
    setFormPortionAdminFormatted(debt.portion_admin ? formatCurrencyString(debt.portion_admin) : "");
    setFormPortionMemberFormatted(debt.portion_member ? formatCurrencyString(debt.portion_member) : "");
    setFormDueDate(debt.due_date);
    setFormNote(debt.note || "");
    setIsFormOpen(true);
  };

  const handleSplit5050 = () => {
    const principal = parseCurrencyStringToNumber(formPrincipalFormatted);
    const half = Math.floor(principal / 2);
    setFormPortionAdminFormatted(formatCurrencyString(half));
    setFormPortionMemberFormatted(formatCurrencyString(principal - half));
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseCurrencyStringToNumber(formPrincipalFormatted);
    const portionAdmin = parseCurrencyStringToNumber(formPortionAdminFormatted);
    const portionMember = parseCurrencyStringToNumber(formPortionMemberFormatted);

    setIsSubmitting(true);
    try {
      if (editingDebt) {
        await debtsService.updateDebt(editingDebt.id, {
          type: formType,
          counterparty: formCounterparty,
          principal,
          portion_admin: formUsePortion ? portionAdmin : 0,
          portion_member: formUsePortion ? portionMember : 0,
          due_date: formDueDate,
          note: formNote,
        });
        toast.success(`Catatan ${formType} "${formCounterparty}" berhasil diperbarui!`);
      } else {
        await debtsService.createDebt({
          owner_type: formOwnerType,
          type: formType,
          counterparty: formCounterparty,
          principal,
          portion_admin: formUsePortion ? portionAdmin : 0,
          portion_member: formUsePortion ? portionMember : 0,
          due_date: formDueDate,
          note: formNote,
        });
        toast.success(`Catatan ${formType} "${formCounterparty}" berhasil dibuat!`);
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      const description =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error("Gagal menyimpan catatan utang/piutang", { description });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtId || !payWalletId || !payAmountFormatted) return;

    const amount = parseCurrencyStringToNumber(payAmountFormatted);
    setIsPaying(true);
    try {
      await debtsService.addPayment(selectedDebtId, {
        wallet_id: payWalletId,
        amount,
        date: payDate,
      });
      toast.success("Pembayaran berhasil dicatat!");
      setPayAmountFormatted("");
      setSelectedDebtId(null);
      loadData();
    } catch (err) {
      const description =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error("Gagal mencatat pembayaran", { description });
    } finally {
      setIsPaying(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDebtId) return;
    try {
      await debtsService.deleteDebt(deletingDebtId);
      toast.success("Catatan berhasil dihapus!");
      setDeletingDebtId(null);
      loadData();
    } catch {
      toast.error("⚠️ DATA TIDAK DAPAT DIHAPUS!", {
        description: "Utang/Piutang ini masih memiliki riwayat pembayaran aktif. Void pembayaran terkait lebih dulu.",
      });
    }
  };

  const handleVoidPayment = async (debtId: string, paymentId: string) => {
    try {
      await debtsService.voidPayment(debtId, paymentId);
      toast.info("Pembayaran berhasil di-void");
      loadData();
    } catch {
      toast.error("Gagal membatalkan pembayaran.");
    }
  };

  // Data Controls for Debts
  const debtFilterConfigs = useMemo<FilterConfig<Debt>[]>(() => {
    return [
      {
        id: "type",
        label: "Tipe Record",
        type: "select",
        options: [
          { label: "Utang Kami (Kewajiban)", value: "utang" },
          { label: "Piutang Kami (Tagihan)", value: "piutang" },
        ],
      },
      {
        id: "status",
        label: "Status Pelunasan",
        type: "select",
        options: [
          { label: "Belum Dibayar", value: "active" },
          { label: "Cicilan", value: "partial" },
          { label: "Lunas", value: "paid" },
        ],
      },
    ];
  }, []);

  const debtSortOptions = useMemo(() => {
    return [
      { label: "Jatuh Tempo Terdekat", rules: [{ field: "due_date", order: "asc" as const }] },
      { label: "Jatuh Tempo Terjauh", rules: [{ field: "due_date", order: "desc" as const }] },
      { label: "Pokok Terbesar", rules: [{ field: "principal", order: "desc" as const }] },
      { label: "Pokok Terkecil", rules: [{ field: "principal", order: "asc" as const }] },
    ];
  }, []);

  const [debtSortIndex, setDebtSortIndex] = useState(0);

  const debtControls = useDataControls<Debt>({
    data: debts,
    searchFields: ["counterparty", "note"],
    searchPredicate: (item, q) =>
      item.counterparty.toLowerCase().includes(q) ||
      (item.note ? item.note.toLowerCase().includes(q) : false),
    initialSort: debtSortOptions[0].rules,
    initialPageSize: 10,
  });

  // Data Controls for Debt Payments (Riwayat Cicilan & Pelunasan)
  const payFilterConfigs = useMemo<FilterConfig<DebtPayment>[]>(() => {
    return [
      {
        id: "wallet_id",
        label: "Wallet",
        type: "select",
        options: wallets.map((w) => ({ label: w.name, value: w.id })),
      },
      {
        id: "status",
        label: "Status Payment",
        type: "select",
        options: [
          { label: "Aktif", value: "active" },
          { label: "Void", value: "void" },
        ],
      },
    ];
  }, [wallets]);

  const paySortOptions = useMemo(() => {
    return [
      { label: "Tanggal Terbaru", rules: [{ field: "date", order: "desc" as const }] },
      { label: "Tanggal Terlama", rules: [{ field: "date", order: "asc" as const }] },
      { label: "Nominal Terbesar", rules: [{ field: "amount", order: "desc" as const }] },
    ];
  }, []);

  const [paySortIndex, setPaySortIndex] = useState(0);

  const payControls = useDataControls({
    data: payments,
    searchFields: ["date"],
    initialSort: paySortOptions[0].rules,
    initialPageSize: 10,
  });

  const activeDebtForPayment = debts.find((d) => d.id === selectedDebtId);

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
            Lacak pokok kewajiban & tagihan keluarga, porsi tanggung jawab, dan pembayaran via wallet.
          </p>
        </div>
      </div>

      {/* Tidy & Compact Filter Bar with Add Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card border border-border/60 p-4 rounded-xl shadow-2xs">
        <DataTableToolbar
          className="flex-1"
          searchQuery={debtControls.searchQuery}
          onSearchChange={debtControls.setSearchQuery}
          searchPlaceholder="Cari pihak kedua atau catatan..."
          filterConfigs={debtFilterConfigs}
          filters={debtControls.filters}
          onFilterChange={debtControls.setFilter}
          onClearFilters={debtControls.clearAllFilters}
          activeFilterCount={debtControls.activeFilterCount}
          sortOptions={debtSortOptions}
          currentSortIndex={debtSortIndex}
          onSortChange={(idx) => {
            setDebtSortIndex(idx);
            debtControls.setSortRules(debtSortOptions[idx].rules);
          }}
        />

        <Button onClick={handleOpenCreate} className="gap-2 shrink-0 h-9 text-xs">
          <PlusIcon className="size-4" />
          Tambah Utang / Piutang
        </Button>
      </div>

      {/* Debts Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Daftar Utang & Piutang</CardTitle>
            <CardDescription className="text-xs">
              Pencatatan kewajiban bayar (utang) & hak tagihan (piutang) keluarga.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {debtControls.totalItems} Records
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasError ? (
            <ErrorState onRetry={loadData} />
          ) : isLoading ? (
            <DataTableSkeleton rows={5} cols={7} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Pihak Kedua (Counterparty)</TableHead>
                  <TableHead>Kepemilikan</TableHead>
                  <TableHead className="text-right">Pokok Awal</TableHead>
                  <TableHead className="text-right">Progress Pelunasan</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtControls.paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <EmptyState
                        icon={HandshakeIcon}
                        title="Tidak Ada Utang / Piutang"
                        description="Belum ada pencatatan tagihan utang atau pinjaman piutang."
                        isFiltered={debtControls.activeFilterCount > 0 || debtControls.searchQuery.trim() !== ""}
                        onReset={debtControls.clearAllFilters}
                        actionLabel="Catat Utang / Piutang"
                        onAction={handleOpenCreate}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                debtControls.paginatedData.map((debt) => {
                  const canEdit = isAdmin || debt.owner_user_id === activeUserId;
                  const ownerMember = members.find((m) => m.user_id === debt.owner_user_id);

                  const debtPayments = payments.filter(
                    (p) => p.debt_id === debt.id && p.status === "active"
                  );
                  const paidTotal = debtPayments.reduce((sum, p) => sum + p.amount, 0);
                  const progressPct = Math.min(100, Math.round((paidTotal / debt.principal) * 100));
                  const isUtang = debt.type === "utang";
                  const status = STATUS_LABEL[debt.status] ?? STATUS_LABEL.active;

                  return (
                    <TableRow key={debt.id}>
                      <TableCell>
                        <Badge
                          variant={isUtang ? "destructive" : "default"}
                          className={`gap-1 text-[11px] ${
                            isUtang
                              ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                              : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
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
                        <div>{debt.counterparty}</div>
                        {debt.note && <div className="text-xs text-muted-foreground">{debt.note}</div>}
                        {Boolean(debt.portion_admin || debt.portion_member) && (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span className="bg-muted px-1.5 py-0.5 rounded font-mono">
                              Admin: Rp {(debt.portion_admin || 0).toLocaleString("id-ID")}
                            </span>
                            <span className="bg-muted px-1.5 py-0.5 rounded font-mono">
                              Member: Rp {(debt.portion_member || 0).toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {debt.owner_household_id ? "Household" : ownerMember?.name || "Personal"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm font-mono">
                        Rp {debt.principal.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs max-w-[200px]">
                        <div className="font-medium text-emerald-600">
                          Rp {paidTotal.toLocaleString("id-ID")}{" "}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({progressPct}%)
                          </span>
                        </div>
                        <Progress value={progressPct} className="h-1.5 mt-1" />
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {debt.due_date}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`gap-1 text-[10px] ${status.className}`}>
                          <status.icon className="size-3" /> {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setDetailDebt(debt);
                              setIsDetailOpen(true);
                            }}
                            title="Lihat Detail Utang/Piutang"
                          >
                            <EyeIcon className="size-3.5" />
                          </Button>
                          {debt.status !== "paid" && debt.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                setSelectedDebtId(debt.id);
                                setPayWalletId(wallets[0]?.id || "");
                              }}
                            >
                              <WalletIcon className="size-3" />
                              {isUtang ? "Bayar" : "Terima"}
                            </Button>
                          )}
                          {canEdit && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEdit(debt)}
                                title="Edit Utang/Piutang"
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                onClick={() => setDeletingDebtId(debt.id)}
                                title="Hapus Utang/Piutang"
                              >
                                <TrashIcon className="size-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          )}

          <DataPagination
            page={debtControls.page}
            totalPages={debtControls.totalPages}
            totalItems={debtControls.totalItems}
            pageSize={debtControls.pageSize}
            onPageChange={debtControls.setPage}
          />
        </CardContent>
      </Card>

      {/* Form Dialog (Create & Edit) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSaveDebt}>
            <DialogHeader>
              <DialogTitle>
                {editingDebt ? "Edit Utang / Piutang" : "Tambah Utang / Piutang Baru"}
              </DialogTitle>
              <DialogDescription>
                Catat utang kewajiban atau piutang tagihan baru keluarga.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-sm">
              <div className="grid gap-2">
                <Label>Tipe Pencatatan</Label>
                <Select value={formType} onValueChange={(val) => setFormType(val as DebtType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utang">Utang Kami (Kewajiban)</SelectItem>
                    <SelectItem value="piutang">Piutang Kami (Tagihan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!editingDebt && (
                <div className="grid gap-2">
                  <Label>Kepemilikan</Label>
                  <Select
                    value={formOwnerType}
                    onValueChange={(val) => setFormOwnerType(val as "user" | "household")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Personal (Saya)</SelectItem>
                      {isAdmin && <SelectItem value="household">Household (Bersama)</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Pihak Kedua (Counterparty)</Label>
                <Input
                  placeholder="Contoh: Bank BCA, Rekan kerja Budi, dll."
                  value={formCounterparty}
                  onChange={(e) => setFormCounterparty(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Nominal Pokok Awal</Label>
                <CurrencyInput
                  placeholder="1.500.000"
                  value={formPrincipalFormatted}
                  onValueChange={(_, formatted) => setFormPrincipalFormatted(formatted)}
                  required
                />
              </div>

              {/* Optional Portion Toggle */}
              <div className="border border-border/60 rounded-lg p-3 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Aktifkan Porsi Tanggung Jawab</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Bagi rincian pokok tanggung jawab admin vs member.
                    </p>
                  </div>
                  <Switch checked={formUsePortion} onCheckedChange={setFormUsePortion} />
                </div>

                {formUsePortion && (
                  <div className="pt-2 border-t border-border/40 space-y-3">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        onClick={handleSplit5050}
                        className="text-[11px] h-6 px-2"
                      >
                        <UsersThreeIcon className="size-3 mr-1" /> Bagi 50:50
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Porsi Admin</Label>
                        <CurrencyInput
                          placeholder="Porsi Admin"
                          value={formPortionAdminFormatted}
                          onValueChange={(_, formatted) => setFormPortionAdminFormatted(formatted)}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Porsi Member</Label>
                        <CurrencyInput
                          placeholder="Porsi Member"
                          value={formPortionMemberFormatted}
                          onValueChange={(_, formatted) => setFormPortionMemberFormatted(formatted)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Tanggal Jatuh Tempo</Label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Catatan / Keterangan (Opsional)</Label>
                <Input
                  placeholder="Catatan keperluaan atau nomor referensi..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {editingDebt ? "Simpan Perubahan" : "Buat Catatan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {activeDebtForPayment && (
        <Dialog
          open={!!selectedDebtId}
          onOpenChange={(open) => {
            if (!open) setSelectedDebtId(null);
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handlePayDebt}>
              <DialogHeader>
                <DialogTitle>
                  {activeDebtForPayment.type === "utang"
                    ? "Catat Pembayaran Utang"
                    : "Catat Penerimaan Piutang"}
                </DialogTitle>
                <DialogDescription>
                  Pilih wallet yang akan{" "}
                  {activeDebtForPayment.type === "utang" ? "dipotong" : "bertambah"} saldonya.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 border border-border/60">
                  <div className="font-semibold text-sm">{activeDebtForPayment.counterparty}</div>
                  <div>
                    Total Pokok: Rp {activeDebtForPayment.principal.toLocaleString("id-ID")}
                  </div>
                  {activeDebtForPayment.note && (
                    <div className="text-muted-foreground">{activeDebtForPayment.note}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>Pilih Wallet (Terotorisasi)</Label>
                  <Select value={payWalletId} onValueChange={setPayWalletId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih wallet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} (Saldo: Rp {w.balance.toLocaleString("id-ID")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isAdmin && (
                    <p className="text-[11px] text-muted-foreground">
                      * Sebagai Member, Anda hanya dapat memotong/menambah saldo dari wallet yang di-assign pada Anda.
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>Jumlah Nominal</Label>
                  <CurrencyInput
                    placeholder="500.000"
                    value={payAmountFormatted}
                    onValueChange={(_, formatted) => setPayAmountFormatted(formatted)}
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
                <Button type="button" variant="outline" onClick={() => setSelectedDebtId(null)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isPaying}>Konfirmasi Pembayaran</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingDebtId} onOpenChange={(open) => !open && setDeletingDebtId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Utang / Piutang</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus catatan utang/piutang ini? Jika masih ada pembayaran aktif, penghapusan akan ditolak.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-rose-600 hover:bg-rose-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment History Card */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b">
          <div>
            <CardTitle className="text-lg">Riwayat Cicilan & Pelunasan (`DEBT_PAYMENTS`)</CardTitle>
            <CardDescription className="text-xs">
              Log histori seluruh transaksi pembayaran utang dan penerimaan piutang.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <DataTableToolbar
            searchQuery={payControls.searchQuery}
            onSearchChange={payControls.setSearchQuery}
            searchPlaceholder="Cari riwayat cicilan berdasarkan tanggal..."
            filterConfigs={payFilterConfigs}
            filters={payControls.filters}
            onFilterChange={payControls.setFilter}
            onClearFilters={payControls.clearAllFilters}
            activeFilterCount={payControls.activeFilterCount}
            sortOptions={paySortOptions}
            currentSortIndex={paySortIndex}
            onSortChange={(idx) => {
              setPaySortIndex(idx);
              payControls.setSortRules(paySortOptions[idx].rules);
            }}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Utang / Piutang</TableHead>
                <TableHead>Wallet Terpotong/Bertambah</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payControls.paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                    Belum ada riwayat cicilan yang sesuai.
                  </TableCell>
                </TableRow>
              ) : (
                payControls.paginatedData.map((dp) => {
                  const debt = debts.find((d) => d.id === dp.debt_id);
                  const wallet = wallets.find((w) => w.id === dp.wallet_id);
                  const isVoid = dp.status === "void";

                  return (
                    <TableRow key={dp.id} className={isVoid ? "opacity-40 bg-muted/20 line-through" : ""}>
                      <TableCell className="font-mono text-xs">{dp.date}</TableCell>
                      <TableCell className="font-medium text-xs">
                        {debt ? (
                          <div>
                            {debt.counterparty}
                            <span className="ml-2 text-[10px] text-muted-foreground uppercase font-semibold">
                              ({debt.type})
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{wallet?.name || "-"}</TableCell>
                      <TableCell className="text-right font-semibold font-mono text-xs">
                        Rp {dp.amount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center">
                        {!isVoid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => handleVoidPayment(dp.debt_id, dp.id)}
                          >
                            <XCircleIcon className="size-3.5 mr-1" />
                            Void
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <DataPagination
            page={payControls.page}
            totalPages={payControls.totalPages}
            totalItems={payControls.totalItems}
            pageSize={payControls.pageSize}
            onPageChange={payControls.setPage}
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <DebtDetailDialog
        debt={detailDebt}
        payments={payments.filter((p) => p.debt_id === detailDebt?.id)}
        wallets={wallets}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onPayClick={(debtId) => {
          setSelectedDebtId(debtId);
          setPayWalletId(wallets[0]?.id || "");
        }}
        onEditClick={handleOpenEdit}
        onDeleteClick={(debtId) => setDeletingDebtId(debtId)}
        canEdit={detailDebt ? isAdmin || detailDebt.owner_user_id === activeUserId : false}
      />
    </div>
  );
}
