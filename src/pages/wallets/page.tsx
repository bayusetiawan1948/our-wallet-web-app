import React, { useState, useMemo } from "react";
import { useMockStore } from "@/lib/mock-store";
import type { WalletType } from "@/types";
import { useDataControls, type FilterConfig } from "@/hooks/use-data-controls";
import { DataTableToolbar } from "@/components/common/data-table-toolbar";
import { DataPagination } from "@/components/common/data-table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { CardGridSkeleton, DataTableSkeleton } from "@/components/common/loading-skeleton";
import { ErrorState } from "@/components/common/error-state";
import {
  WalletIcon,
  ScalesIcon,
  BankIcon,
  CreditCardIcon,
  MoneyIcon,
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  InfoIcon,
  DotsThreeVerticalIcon,
} from "@phosphor-icons/react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatRupiah } from "@/libs/number";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const activeUser = store.getActiveUser();
  const isAdmin = store.activeRole === "admin";

  // Reconciliation State
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState<string>("");
  const [reconcileNotes, setReconcileNotes] = useState<string>("");

  // Create Wallet State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<WalletType>("bank");
  const [newInitialBalance, setNewInitialBalance] = useState("0");
  const [newOwnerType, setNewOwnerType] = useState<"user" | "household">("user");
  const [newOwnerUserId, setNewOwnerUserId] = useState(activeUser.id);

  // Edit & Delete Wallet State
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [deletingWalletId, setDeletingWalletId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<WalletType>("bank");
  const [editOwnerType, setEditOwnerType] = useState<"user" | "household">("user");
  const [editOwnerUserId, setEditOwnerUserId] = useState("");

  const selectedWallet = store.wallets.find((w) => w.id === selectedWalletId);
  const recordedBal = selectedWallet?.balance || 0;
  const numActual = parseFloat(actualBalanceInput) || 0;
  const diff = numActual - recordedBal;

  // Data Controls for Wallets Grid
  const walletFilterConfigs = useMemo<FilterConfig<(typeof store.wallets)[0]>[]>(() => {
    return [
      {
        id: "type",
        label: "Tipe Dompet",
        type: "select",
        options: [
          { label: "Bank", value: "bank" },
          { label: "E-Wallet", value: "ewallet" },
          { label: "Cash / Uang Tunai", value: "cash" },
        ],
      },
    ];
  }, []);

  const walletSortOptions = useMemo(() => {
    return [
      { label: "Saldo Terbesar", rules: [{ field: "balance", order: "desc" as const }] },
      { label: "Saldo Terkecil", rules: [{ field: "balance", order: "asc" as const }] },
      { label: "Nama (A - Z)", rules: [{ field: "name", order: "asc" as const }] },
    ];
  }, []);

  const [walletSortIndex, setWalletSortIndex] = useState(0);

  const walletControls = useDataControls({
    data: accessibleWallets,
    searchFields: ["name", "type"],
    initialSort: walletSortOptions[0].rules,
    initialPageSize: 10,
  });

  // Data Controls for Reconciliations Table
  const recSortOptions = useMemo(() => {
    return [
      { label: "Tanggal Terbaru", rules: [{ field: "date", order: "desc" as const }] },
      { label: "Tanggal Terlama", rules: [{ field: "date", order: "asc" as const }] },
    ];
  }, []);

  const [recSortIndex, setRecSortIndex] = useState(0);

  const recControls = useDataControls({
    data: store.reconciliations,
    searchFields: ["notes", "date"],
    initialSort: recSortOptions[0].rules,
    initialPageSize: 10,
  });

  const handleReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletId || actualBalanceInput === "") return;

    store.reconcileWallet(selectedWalletId, numActual, reconcileNotes);
    setActualBalanceInput("");
    setReconcileNotes("");
    setSelectedWalletId(null);
  };

  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const initialBalNum = parseFloat(newInitialBalance) || 0;

    const success = store.addWallet({
      name: newName.trim(),
      type: newType,
      initialBalance: initialBalNum,
      ownerType: newOwnerType,
      ownerUserId: newOwnerType === "user" ? newOwnerUserId : undefined,
    });

    if (success) {
      setNewName("");
      setNewType("bank");
      setNewInitialBalance("0");
      setNewOwnerType("user");
      setNewOwnerUserId(activeUser.id);
      setIsAddOpen(false);
    }
  };

  const openEditDialog = (walletId: string) => {
    const w = store.wallets.find((item) => item.id === walletId);
    if (!w) return;

    setEditingWalletId(walletId);
    setEditName(w.name);
    setEditType(w.type);
    if (w.owner_household_id) {
      setEditOwnerType("household");
      setEditOwnerUserId(activeUser.id);
    } else {
      setEditOwnerType("user");
      setEditOwnerUserId(w.owner_user_id || activeUser.id);
    }
  };

  const handleUpdateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWalletId || !editName.trim()) return;

    const success = store.updateWallet(editingWalletId, {
      name: editName.trim(),
      type: editType,
      ownerType: editOwnerType,
      ownerUserId: editOwnerType === "user" ? editOwnerUserId : undefined,
    });

    if (success) {
      setEditingWalletId(null);
    }
  };

  return (
    <TooltipProvider>
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

          {/* Add Wallet Trigger */}
          {isAdmin ? (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shrink-0">
                  <PlusIcon className="size-4" />
                  Tambah Dompet Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddWallet}>
                  <DialogHeader>
                    <DialogTitle>Tambah Dompet Baru</DialogTitle>
                    <DialogDescription>
                      Buat dompet baru untuk mencatat transaksi keluarga atau pribadi.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nama Dompet</Label>
                      <Input
                        id="name"
                        placeholder="Contoh: BCA Tabungan Utama, GoPay, Cash Bayu"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="type">Jenis / Tipe Dompet</Label>
                      <Select value={newType} onValueChange={(val) => setNewType(val as WalletType)}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Pilih tipe dompet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Bank (BCA, Mandiri, BNI, dll)</SelectItem>
                          <SelectItem value="ewallet">E-Wallet (GoPay, OVO, ShopeePay, dll)</SelectItem>
                          <SelectItem value="cash">Uang Tunai (Cash / Dompet Fisik)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="ownerType">Kepemilikan Dompet</Label>
                      <Select
                        value={newOwnerType}
                        onValueChange={(val) => setNewOwnerType(val as "user" | "household")}
                      >
                        <SelectTrigger id="ownerType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Dompet Anggota / Perorangan</SelectItem>
                          <SelectItem value="household">Kantong Bersama Keluarga (Household)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newOwnerType === "user" && (
                      <div className="grid gap-2">
                        <Label htmlFor="ownerUser">Pemilik Dompet</Label>
                        <Select value={newOwnerUserId} onValueChange={setNewOwnerUserId}>
                          <SelectTrigger id="ownerUser">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {store.users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name} {u.id === activeUser.id ? "(Saya)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="initialBal">Saldo Awal</Label>
                      <CurrencyInput
                        id="initialBal"
                        value={newInitialBalance}
                        onValueChange={(num) => setNewInitialBalance(num.toString())}
                        required
                      />
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <InfoIcon className="size-3 text-primary shrink-0" />
                        Saldo awal akan dicatat sebagai transaksi Pemasukan awal sistem.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">Buat Dompet</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button disabled className="gap-2 shrink-0 opacity-60 cursor-not-allowed">
                    <PlusIcon className="size-4" />
                    Tambah Dompet Baru
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Hanya Admin (Kepala Keluarga) yang dapat membuat dompet baru.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Toolbar for Wallets */}
        <div className="bg-card border border-border/60 p-4 rounded-xl shadow-2xs">
          <DataTableToolbar
            searchQuery={walletControls.searchQuery}
            onSearchChange={walletControls.setSearchQuery}
            searchPlaceholder="Cari nama dompet..."
            filterConfigs={walletFilterConfigs}
            filters={walletControls.filters}
            onFilterChange={walletControls.setFilter}
            onClearFilters={walletControls.clearAllFilters}
            activeFilterCount={walletControls.activeFilterCount}
            sortOptions={walletSortOptions}
            currentSortIndex={walletSortIndex}
            onSortChange={(idx) => {
              setWalletSortIndex(idx);
              walletControls.setSortRules(walletSortOptions[idx].rules);
            }}
          />
        </div>

        {/* Accessible Wallets Grid */}
        {store.simulatedError ? (
          <ErrorState onRetry={() => store.setSimulatedError(false)} />
        ) : store.simulatedLoading ? (
          <CardGridSkeleton count={4} />
        ) : walletControls.paginatedData.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title="Tidak Ada Dompet"
            description="Belum ada akun dompet atau kantong bersama yang tercatat."
            isFiltered={walletControls.activeFilterCount > 0 || walletControls.searchQuery.trim() !== ""}
            onReset={walletControls.clearAllFilters}
            actionLabel={isAdmin ? "Tambah Dompet Baru" : undefined}
            onAction={isAdmin ? () => setIsAddOpen(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {walletControls.paginatedData.map((w) => {
            const ownerUser = store.users.find((u) => u.id === w.owner_user_id);
            const trackCheck = store.hasWalletTrackRecord(w.id);
            const canEdit = isAdmin || w.owner_user_id === activeUser.id;
            const canManage = canEdit || isAdmin;

            return (
              <Card key={w.id} className="relative overflow-hidden border-border/60 hover:shadow-xs transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1 pr-2">
                    <CardTitle className="text-base font-semibold leading-tight">{w.name}</CardTitle>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {ownerUser ? `Milik ${ownerUser.name}` : "Kantong Bersama"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Type Icon */}
                    {w.type === "bank" ? (
                      <BankIcon className="size-5 text-blue-500 shrink-0 mr-1" />
                    ) : w.type === "ewallet" ? (
                      <CreditCardIcon className="size-5 text-emerald-500 shrink-0 mr-1" />
                    ) : (
                      <MoneyIcon className="size-5 text-amber-500 shrink-0 mr-1" />
                    )}

                    {/* 3-Dots Action Dropdown Menu */}
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            title="Opsi Dompet"
                          >
                            <DotsThreeVerticalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {canEdit && (
                            <DropdownMenuItem onClick={() => openEditDialog(w.id)}>
                              <PencilSimpleIcon className="size-4 mr-2" />
                              Edit Dompet
                            </DropdownMenuItem>
                          )}

                          {isAdmin && (
                            <>
                              {canEdit && <DropdownMenuSeparator />}
                              <DropdownMenuItem
                                onClick={() => {
                                  if (trackCheck.hasRecord) {
                                    store.deleteWallet(w.id);
                                  } else {
                                    setDeletingWalletId(w.id);
                                  }
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <TrashIcon className="size-4 mr-2 text-destructive" />
                                {trackCheck.hasRecord ? "Hapus Dompet (Terkunci)" : "Hapus Dompet"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Edit Wallet Dialog */}
                    <Dialog
                      open={editingWalletId === w.id}
                      onOpenChange={(open) => {
                        if (!open) setEditingWalletId(null);
                      }}
                    >
                      <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleUpdateWallet}>
                          <DialogHeader>
                            <DialogTitle>Edit Dompet — {w.name}</DialogTitle>
                            <DialogDescription>
                              Perbarui nama dan tipe dompet ini.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="editName">Nama Dompet</Label>
                              <Input
                                id="editName"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                required
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="editType">Jenis / Tipe Dompet</Label>
                              <Select value={editType} onValueChange={(val) => setEditType(val as WalletType)}>
                                <SelectTrigger id="editType">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bank">Bank</SelectItem>
                                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                                  <SelectItem value="cash">Uang Tunai (Cash)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {isAdmin && (
                              <div className="grid gap-2">
                                <Label htmlFor="editOwnerType">Kepemilikan</Label>
                                <Select
                                  value={editOwnerType}
                                  onValueChange={(val) => setEditOwnerType(val as "user" | "household")}
                                >
                                  <SelectTrigger id="editOwnerType">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">Dompet Anggota / Perorangan</SelectItem>
                                    <SelectItem value="household">Kantong Bersama Keluarga</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingWalletId(null)}>
                              Batal
                            </Button>
                            <Button type="submit">Simpan Perubahan</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {/* Delete Wallet Confirmation Dialog */}
                    <AlertDialog
                      open={deletingWalletId === w.id}
                      onOpenChange={(open) => {
                        if (!open) setDeletingWalletId(null);
                      }}
                    >
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Dompet "{w.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus dompet ini? Dompet ini belum memiliki riwayat transaksi sehingga aman untuk dihapus.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeletingWalletId(null)}>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              store.deleteWallet(w.id);
                              setDeletingWalletId(null);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Hapus Dompet
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {(() => {
                    const breakdown = store.getWalletBalanceBreakdown(w.id);
                    return (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Saldo Total</div>
                            <div className="text-lg font-bold font-mono tracking-tight text-foreground">
                              {formatRupiah(breakdown.totalBalance)}
                            </div>
                          </div>
                          <Badge
                            variant={breakdown.freeBalance < 0 ? "destructive" : "outline"}
                            className="text-[10px] font-mono"
                          >
                            {breakdown.freeBalance < 0 ? "Bebas Minus" : "Saldo Safe"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                          <div className="p-2 rounded-md bg-muted/40 space-y-0.5">
                            <span className="text-[10px] text-muted-foreground block">Terpesan (Reserved)</span>
                            <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 block">
                              {formatRupiah(breakdown.reservedBalance)}
                            </span>
                          </div>

                          <div className="p-2 rounded-md bg-muted/40 space-y-0.5">
                            <span className="text-[10px] text-muted-foreground block">Saldo Bebas (Free)</span>
                            <span
                              className={`font-mono font-semibold block ${
                                breakdown.freeBalance < 0
                                  ? "text-destructive"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {formatRupiah(breakdown.freeBalance)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10 w-full justify-center"
                          onClick={() => {
                            setSelectedWalletId(w.id);
                            setActualBalanceInput(w.balance.toString());
                          }}
                        >
                          <ScalesIcon className="size-3.5" />
                          Rekonsiliasi Saldo
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
                                {formatRupiah(w.balance)}
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label>Saldo Aktual Fisik</Label>
                              <CurrencyInput
                                value={actualBalanceInput}
                                onValueChange={(num) => setActualBalanceInput(num.toString())}
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
        )}

        <DataPagination
          page={walletControls.page}
          totalPages={walletControls.totalPages}
          totalItems={walletControls.totalItems}
          pageSize={walletControls.pageSize}
          onPageChange={walletControls.setPage}
        />

        {/* Reconciliation History */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b">
            <div>
              <CardTitle className="text-lg">Riwayat Rekonsiliasi (`WALLET_RECONCILIATIONS`)</CardTitle>
              <CardDescription>
                Catatan historis audit pencocokan saldo dompet dan penyesuaian koreksi.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <DataTableToolbar
              searchQuery={recControls.searchQuery}
              onSearchChange={recControls.setSearchQuery}
              searchPlaceholder="Cari catatan rekonsiliasi..."
              filters={recControls.filters}
              onFilterChange={recControls.setFilter}
              onClearFilters={recControls.clearAllFilters}
              activeFilterCount={recControls.activeFilterCount}
              sortOptions={recSortOptions}
              currentSortIndex={recSortIndex}
              onSortChange={(idx) => {
                setRecSortIndex(idx);
                recControls.setSortRules(recSortOptions[idx].rules);
              }}
            />

            {store.simulatedError ? (
              <ErrorState onRetry={() => store.setSimulatedError(false)} />
            ) : store.simulatedLoading ? (
              <DataTableSkeleton rows={3} cols={6} />
            ) : (
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
                  {recControls.paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <EmptyState
                          title="Belum Ada Riwayat Rekonsiliasi"
                          description="Belum ada aktivitas audit pencocokan saldo dompet yang dilakukan."
                          isFiltered={recControls.activeFilterCount > 0 || recControls.searchQuery.trim() !== ""}
                          onReset={recControls.clearAllFilters}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                  recControls.paginatedData.map((rec) => {
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
            )}

            <DataPagination
              page={recControls.page}
              totalPages={recControls.totalPages}
              totalItems={recControls.totalItems}
              pageSize={recControls.pageSize}
              onPageChange={recControls.setPage}
            />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
