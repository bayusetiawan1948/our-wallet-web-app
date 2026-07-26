import React, { useState, useMemo } from "react";
import { useMockStore } from "@/lib/mock-store";
import { type Debt, type DebtType } from "@/types";
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
  UserIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  UsersThreeIcon,
  EyeIcon,
  UserCheckIcon,
} from "@phosphor-icons/react";
import { DebtDetailDialog } from "@/components/feature/debts/debt-detail-dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
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

// Helpers for automatic currency formatting (e.g. 1500000 -> 1.500.000)
function formatCurrencyString(val: string | number): string {
  if (val === "" || val === undefined || val === null) return "";
  const rawNum = typeof val === "number" ? val.toString() : val.replace(/\D/g, "");
  if (!rawNum) return "";
  return parseInt(rawNum, 10).toLocaleString("id-ID");
}

function parseCurrencyStringToNumber(val: string): number {
  const clean = val.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

export default function DebtsReceivablesPage() {
  const store = useMockStore();
  const activeUser = store.getActiveUser();
  const accessibleWallets = store.getAccessibleWallets();
  const users = store.users;

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Create & Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Form Fields State
  const [formType, setFormType] = useState<DebtType>("utang");
  const [formCounterparty, setFormCounterparty] = useState("");
  const [formPrincipalFormatted, setFormPrincipalFormatted] = useState("");
  const [formAssignedUserIds, setFormAssignedUserIds] = useState<string[]>([activeUser.id]);
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

  // Delete Dialog State
  const [deletingDebtId, setDeletingDebtId] = useState<string | null>(null);

  // Detail Modal State
  const [detailDebt, setDetailDebt] = useState<Debt | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingDebt(null);
    setFormType("utang");
    setFormCounterparty("");
    setFormPrincipalFormatted("");
    setFormAssignedUserIds([activeUser.id]);
    setFormUsePortion(false);
    setFormPortionAdminFormatted("");
    setFormPortionMemberFormatted("");
    setFormDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setFormNote("");
    setIsFormOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setFormType(debt.type);
    setFormCounterparty(debt.counterparty);
    setFormPrincipalFormatted(formatCurrencyString(debt.principal));
    const creatorOrAssignee = debt.created_by_user_id || debt.assigned_to_user_id || activeUser.id;
    setFormAssignedUserIds(debt.assigned_user_ids || [creatorOrAssignee]);
    setFormUsePortion(debt.use_portion || false);
    setFormPortionAdminFormatted(debt.portion_admin ? formatCurrencyString(debt.portion_admin) : "");
    setFormPortionMemberFormatted(debt.portion_member ? formatCurrencyString(debt.portion_member) : "");
    setFormDueDate(debt.due_date);
    setFormNote(debt.note || "");
    setIsFormOpen(true);
  };

  // Toggle assigned member in form
  const handleToggleAssignedUser = (userId: string) => {
    setFormAssignedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Auto Split 50:50
  const handleSplit5050 = () => {
    const principal = parseCurrencyStringToNumber(formPrincipalFormatted);
    const half = Math.floor(principal / 2);
    setFormPortionAdminFormatted(formatCurrencyString(half));
    setFormPortionMemberFormatted(formatCurrencyString(principal - half));
  };

  // Submit Form (Create / Edit)
  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseCurrencyStringToNumber(formPrincipalFormatted);
    const portionAdmin = parseCurrencyStringToNumber(formPortionAdminFormatted);
    const portionMember = parseCurrencyStringToNumber(formPortionMemberFormatted);

    const payload = {
      type: formType,
      counterparty: formCounterparty,
      principal,
      assigned_to_user_id: formAssignedUserIds[0] || activeUser.id,
      assigned_user_ids: formAssignedUserIds.length > 0 ? formAssignedUserIds : [activeUser.id],
      use_portion: formUsePortion,
      portion_admin: formUsePortion ? portionAdmin : undefined,
      portion_member: formUsePortion ? portionMember : undefined,
      due_date: formDueDate,
      note: formNote,
    };

    const success = editingDebt
      ? store.updateDebt(editingDebt.id, payload)
      : store.addDebt(payload);

    if (success) {
      setIsFormOpen(false);
    }
  };

  // Submit Payment
  const handlePayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtId || !payWalletId || !payAmountFormatted) return;

    const amount = parseCurrencyStringToNumber(payAmountFormatted);
    const success = store.addDebtPayment(selectedDebtId, payWalletId, amount, payDate);

    if (success) {
      setPayAmountFormatted("");
      setSelectedDebtId(null);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (deletingDebtId) {
      store.deleteDebt(deletingDebtId);
      setDeletingDebtId(null);
    }
  };

  // Filtered Debts List
  const filteredDebts = useMemo(() => {
    return store.debts.filter((d) => {
      // Search
      const matchesSearch =
        d.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.note && d.note.toLowerCase().includes(searchQuery.toLowerCase()));

      // Type Filter
      const matchesType = typeFilter === "all" || d.type === typeFilter;

      // Status Filter
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;

      // Assignee Filter
      const assignedList = d.assigned_user_ids || [d.created_by_user_id || d.assigned_to_user_id || "user-1"];
      const matchesAssignee = assigneeFilter === "all" || assignedList.includes(assigneeFilter);

      return matchesSearch && matchesType && matchesStatus && matchesAssignee;
    });
  }, [store.debts, searchQuery, typeFilter, statusFilter, assigneeFilter]);

  const activeDebtForPayment = store.debts.find((d) => d.id === selectedDebtId);

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
            Lacak pokok kewajiban & tagihan keluarga, assign penanggung jawab anggota, porsi tanggung jawab, dan pembayaran via wallet.
          </p>
        </div>
      </div>

      {/* Tidy & Compact Filter Bar with Add Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card border border-border/60 p-4 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari counterparty / catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="text-xs h-9 w-[150px]">
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="utang">Utang (Kewajiban)</SelectItem>
              <SelectItem value="piutang">Piutang (Tagihan)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-xs h-9 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="belum_lunas">Belum Dibayar</SelectItem>
              <SelectItem value="cicilan">Cicilan</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="text-xs h-9 w-[160px]">
              <SelectValue placeholder="Penanggung Jawab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Anggota</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            {filteredDebts.length} Records
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipe</TableHead>
                <TableHead>Pihak Kedua (Counterparty)</TableHead>
                <TableHead>Penanggung Jawab / Member</TableHead>
                <TableHead className="text-right">Pokok Awal</TableHead>
                <TableHead className="text-right">Progress Pelunasan</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDebts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                    Tidak ada pencatatan utang atau piutang yang cocok dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDebts.map((debt) => {
                  const creatorId = debt.created_by_user_id || debt.assigned_to_user_id || "user-1";
                  const assignedUserIds = debt.assigned_user_ids || [creatorId];
                  const canEdit = activeUser.id === creatorId || store.activeRole === "admin";
                  const canPay = canEdit || assignedUserIds.includes(activeUser.id);

                  const payments = store.debtPayments.filter(
                    (p) => p.debt_id === debt.id && p.status === "active"
                  );
                  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);

                  // Calculate per-member breakdown of payment
                  const memberPaymentMap: Record<string, number> = {};
                  payments.forEach((p) => {
                    memberPaymentMap[p.recorded_by] = (memberPaymentMap[p.recorded_by] || 0) + p.amount;
                  });

                  const progressPct = Math.min(100, Math.round((paidTotal / debt.principal) * 100));
                  const isUtang = debt.type === "utang";
                  const isLunas = debt.status === "lunas";

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
                        {debt.use_portion && (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span className="bg-muted px-1.5 py-0.5 rounded font-mono">
                              Bayu: Rp {(debt.portion_admin || 0).toLocaleString("id-ID")}
                            </span>
                            <span className="bg-muted px-1.5 py-0.5 rounded font-mono">
                              Annisa: Rp {(debt.portion_member || 0).toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {assignedUserIds.map((uId) => {
                            const u = users.find((x) => x.id === uId);
                            return (
                              <Badge key={uId} variant="outline" className="gap-1 text-[10px] font-normal px-1.5 py-0">
                                <UserIcon className="size-2.5 text-muted-foreground" />
                                {u?.name || uId}
                              </Badge>
                            );
                          })}
                        </div>
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

                        {/* Breakdown per member */}
                        {payments.length > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-1 flex justify-end gap-2">
                            {Object.entries(memberPaymentMap).map(([userId, amt]) => {
                              const u = users.find((x) => x.id === userId);
                              const pct = Math.round((amt / (debt.principal || 1)) * 100);
                              return (
                                <span key={userId} title={`${u?.name || userId}: Rp ${amt.toLocaleString("id-ID")}`}>
                                  {u?.name || userId}: {pct}%
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {debt.due_date}
                      </TableCell>
                      <TableCell className="text-center">
                        {isLunas ? (
                          <Badge className="bg-emerald-500 text-white gap-1 text-[10px]">
                            <CheckCircleIcon className="size-3" /> LUNAS
                          </Badge>
                        ) : debt.status === "cicilan" ? (
                          <Badge
                            variant="secondary"
                            className="gap-1 text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20"
                          >
                            <ClockIcon className="size-3" /> CICILAN ({progressPct}%)
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10"
                          >
                            BELUM DIBAYAR
                          </Badge>
                        )}
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
                          {!isLunas && canPay && (
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
                                onClick={() => {
                                  if (store.hasDebtTrackRecord(debt.id)) {
                                    store.deleteDebt(debt.id);
                                  } else {
                                    setDeletingDebtId(debt.id);
                                  }
                                }}
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
                Catat utang kewajiban atau piutang tagihan baru keluarga. Pembuat record otomatis menjadi penanggung jawab.
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

              {/* Multi-assigned member selection */}
              <div className="grid gap-2 border border-border/60 rounded-lg p-3 bg-muted/20">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <UserCheckIcon className="size-4 text-indigo-500" />
                  Member Ditugaskan (Bisa Menginput Pembayaran)
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1">
                  Pembuat record otomatis diset sebagai penanggung jawab utama. Anda dapat mencentang member lain untuk memberi wewenang mencatat pembayaran/penerimaan.
                </p>
                <div className="space-y-2 pt-1">
                  {users.map((u) => {
                    const isChecked = formAssignedUserIds.includes(u.id);
                    const isCreator = editingDebt ? u.id === (editingDebt.created_by_user_id || editingDebt.assigned_to_user_id) : u.id === activeUser.id;
                    return (
                      <div key={u.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`member-${u.id}`}
                          checked={isChecked || isCreator}
                          disabled={isCreator}
                          onCheckedChange={() => handleToggleAssignedUser(u.id)}
                        />
                        <label
                          htmlFor={`member-${u.id}`}
                          className="text-xs font-medium leading-none cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{u.name}</span>
                          {isCreator && <span className="text-[10px] text-indigo-600 font-semibold">(Pembuat Record)</span>}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

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
                <Label>Nominal Pokok Awal (Rp)</Label>
                <Input
                  placeholder="Contoh: 1.500.000"
                  value={formPrincipalFormatted}
                  onChange={(e) => setFormPrincipalFormatted(formatCurrencyString(e.target.value))}
                  required
                />
              </div>

              {/* Optional Portion Toggle */}
              <div className="border border-border/60 rounded-lg p-3 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Aktifkan Porsi Tanggung Jawab</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Bagi rincian pokok tanggung jawab per individu (Bayu vs Annisa).
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
                        <Label className="text-xs">Porsi Bayu (Rp)</Label>
                        <Input
                          placeholder="Porsi Bayu"
                          value={formPortionAdminFormatted}
                          onChange={(e) => setFormPortionAdminFormatted(formatCurrencyString(e.target.value))}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Porsi Annisa (Rp)</Label>
                        <Input
                          placeholder="Porsi Annisa"
                          value={formPortionMemberFormatted}
                          onChange={(e) => setFormPortionMemberFormatted(formatCurrencyString(e.target.value))}
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
              <Button type="submit">
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
                  Pilih wallet milik Anda yang akan{" "}
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
                    placeholder="Contoh: 500.000"
                    value={payAmountFormatted}
                    onChange={(e) => setPayAmountFormatted(formatCurrencyString(e.target.value))}
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
                <Button type="submit">Konfirmasi Pembayaran</Button>
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
              Apakah Anda yakin ingin menghapus catatan utang/piutang ini? Tindakan ini tidak dapat dibatalkan.
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
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Cicilan & Pelunasan (`DEBT_PAYMENTS`)</CardTitle>
          <CardDescription className="text-xs">
            Log histori seluruh transaksi pembayaran utang dan penerimaan piutang.
          </CardDescription>
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
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.debtPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
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
                      <TableCell className="text-xs">{recorder?.name || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-sm font-mono text-emerald-600">
                        Rp {dp.amount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-6 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1"
                          onClick={() => store.deleteDebtPayment(dp.id)}
                          title="Batal / Hapus Pembayaran Ini"
                        >
                          <XCircleIcon className="size-3.5" />
                          Batal
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <DebtDetailDialog
        debt={detailDebt}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onPayClick={(debtId) => {
          setSelectedDebtId(debtId);
          setPayWalletId(accessibleWallets[0]?.id || "");
        }}
        onEditClick={handleOpenEdit}
        onDeleteClick={(debtId) => {
          if (store.hasDebtTrackRecord(debtId)) {
            store.deleteDebt(debtId);
          } else {
            setDeletingDebtId(debtId);
          }
        }}
      />
    </div>
  );
}
