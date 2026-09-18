import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useMockStore } from "@/lib/mock-store";
import * as auditLogsService from "@/services/audit-logs.service";
import * as householdsService from "@/services/households.service";
import type { HouseholdMemberResponse } from "@/services/households.service";
import type { AuditLogResponse } from "@/services/audit-logs.service";
import { useDataControls, type FilterConfig } from "@/hooks/use-data-controls";
import { DataTableToolbar } from "@/components/common/data-table-toolbar";
import { DataPagination } from "@/components/common/data-table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { CardGridSkeleton, DataTableSkeleton } from "@/components/common/loading-skeleton";
import { ErrorState } from "@/components/common/error-state";
import {
  UsersThreeIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  UserIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ListDashesIcon,
  InfoIcon,
  PencilSimpleIcon,
  TrashIcon,
  LockKeyIcon,
  ArrowLeftIcon,
  WarningIcon,
} from "@phosphor-icons/react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ROUTES } from "@/consts/routes";
import type { UserRole } from "@/types";

export default function HouseholdPage() {
  const store = useMockStore();
  const isAdmin = store.activeRole === "admin";
  const activeUser = store.getActiveUser();

  // Audit Logs (real API)
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [auditMembers, setAuditMembers] = useState<HouseholdMemberResponse[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(true);
  const [hasAuditError, setHasAuditError] = useState(false);

  const loadAuditLogs = useCallback(async () => {
    setIsAuditLoading(true);
    setHasAuditError(false);
    try {
      const [logs, members] = await Promise.all([
        auditLogsService.listAuditLogs(),
        householdsService.listMembers(),
      ]);
      setAuditLogs(logs);
      setAuditMembers(members);
    } catch {
      setHasAuditError(true);
    } finally {
      setIsAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // Add Member State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [canEditOthers, setCanEditOthers] = useState(false);

  // Edit Member State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("member");
  const [editCanEditOthers, setEditCanEditOthers] = useState(false);

  // Delete Member State
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Data Controls for Members Grid
  const memberFilterConfigs = useMemo<FilterConfig<(typeof store.members)[0]>[]>(() => {
    return [
      {
        id: "role",
        label: "Role / Akses",
        type: "select",
        options: [
          { label: "Admin / Kepala Keluarga", value: "admin" },
          { label: "Member / Pasangan", value: "member" },
        ],
      },
    ];
  }, []);

  const memberSortOptions = useMemo(() => {
    return [
      { label: "Role", rules: [{ field: "role", order: "asc" as const }] },
    ];
  }, []);

  const [memberSortIndex, setMemberSortIndex] = useState(0);

  const memberControls = useDataControls({
    data: store.members,
    initialSort: memberSortOptions[0].rules,
    initialPageSize: 10,
  });

  // Data Controls for Audit Logs Table
  const auditSortOptions = useMemo(() => {
    return [
      { label: "Terbaru", rules: [{ field: "created_at", order: "desc" as const }] },
      { label: "Terlama", rules: [{ field: "created_at", order: "asc" as const }] },
    ];
  }, []);

  const [auditSortIndex, setAuditSortIndex] = useState(0);

  const auditControls = useDataControls({
    data: auditLogs,
    searchFields: ["action", "entity_type"],
    initialSort: auditSortOptions[0].rules,
    initialPageSize: 10,
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName || !memberEmail) return;
    store.addMember(memberName, memberEmail, canEditOthers);
    setMemberName("");
    setMemberEmail("");
    setCanEditOthers(false);
    setIsAddOpen(false);
  };

  const openEditModal = (userId: string) => {
    const user = store.users.find((u) => u.id === userId);
    const member = store.members.find((m) => m.user_id === userId);
    if (user && member) {
      setEditingUserId(userId);
      setEditName(user.name);
      setEditEmail(user.email);
      setEditRole(member.role);
      setEditCanEditOthers(member.can_edit_others_transactions);
    }
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editName || !editEmail) return;
    store.updateMember(editingUserId, {
      name: editName,
      email: editEmail,
      role: editRole,
      canEditOthers: editCanEditOthers,
    });
    setEditingUserId(null);
  };

  const handleDeleteMember = () => {
    if (!deletingUserId) return;
    store.deleteMember(deletingUserId);
    setDeletingUserId(null);
  };

  // If Member role accesses directly, show Access Denied UI
  if (!isAdmin) {
    return (
      <div className="py-12 px-6 max-w-2xl mx-auto space-y-6 text-center">
        <Card className="border-border/60 p-8 shadow-sm">
          <CardHeader className="items-center pb-2">
            <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <LockKeyIcon className="size-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Akses Dibatasi Khusus Admin</CardTitle>
            <CardDescription className="text-sm max-w-md pt-2">
              Halaman <strong>Household & Akses</strong> hanya dapat diakses oleh Kepala Keluarga / Admin. Akun Anda saat ini terdaftar sebagai <strong>Member / Pasangan</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-muted/50 p-4 rounded-xl border border-border/40 text-xs text-muted-foreground text-left space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <InfoIcon className="size-4 text-blue-500 shrink-0" />
                Catatan Hak Akses Member:
              </p>
              <p>• Member dapat mencatat transaksi, melihat laporan terisolasi, dan mentransfer antar dompet.</p>
              <p>• Manajemen anggota, pengesetan izin, dan pembagian dompet dikelola sepenuhnya oleh Admin.</p>
            </div>
            <Button asChild className="gap-2 mt-4">
              <Link to={ROUTES.DASHBOARD}>
                <ArrowLeftIcon className="size-4" />
                Kembali ke Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 sm:px-8 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/60 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UsersThreeIcon className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{store.household.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Kelola anggota keluarga, peran (Admin vs Member), hak akses dompet terisolasi, dan riwayat audit log aktivitas.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlusIcon className="size-4" />
              Tambah Anggota / Pasangan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddMember}>
              <DialogHeader>
                <DialogTitle>Tambah Member Baru</DialogTitle>
                <DialogDescription>
                  Buatkan akun untuk pasangan atau anggota keluarga lain untuk mengelola dana terisolasi.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Annisa Permata"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="annisa@family.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 pt-2 border-t">
                  <div className="space-y-0.5">
                    <Label htmlFor="edit-permission" className="text-sm font-medium">
                      Izin Edit Transaksi Anggota Lain
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Izinkan member ini mengedit/void transaksi milik anggota keluarga lain.
                    </p>
                  </div>
                  <Switch
                    id="edit-permission"
                    checked={canEditOthers}
                    onCheckedChange={setCanEditOthers}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Simpan Member</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="members" className="gap-2">
            <UsersThreeIcon className="size-4" />
            Anggota & Hak Akses
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="gap-2">
            <ListDashesIcon className="size-4" />
            Audit Logs ({auditLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Members & Access */}
        <TabsContent value="members" className="space-y-6 pt-4">
          <div className="bg-card border border-border/60 p-4 rounded-xl shadow-2xs">
            <DataTableToolbar
              searchQuery={memberControls.searchQuery}
              onSearchChange={memberControls.setSearchQuery}
              searchPlaceholder="Cari anggota..."
              filterConfigs={memberFilterConfigs}
              filters={memberControls.filters}
              onFilterChange={memberControls.setFilter}
              onClearFilters={memberControls.clearAllFilters}
              activeFilterCount={memberControls.activeFilterCount}
              sortOptions={memberSortOptions}
              currentSortIndex={memberSortIndex}
              onSortChange={(idx) => {
                setMemberSortIndex(idx);
                memberControls.setSortRules(memberSortOptions[idx].rules);
              }}
            />
          </div>

          {store.simulatedError ? (
            <ErrorState onRetry={() => store.setSimulatedError(false)} />
          ) : store.simulatedLoading ? (
            <CardGridSkeleton count={2} />
          ) : memberControls.paginatedData.length === 0 ? (
            <EmptyState
              icon={UsersThreeIcon}
              title="Tidak Ada Anggota"
              description="Belum ada anggota keluarga atau pasangan yang tercatat."
              isFiltered={memberControls.activeFilterCount > 0 || memberControls.searchQuery.trim() !== ""}
              onReset={memberControls.clearAllFilters}
              actionLabel="Tambah Member"
              onAction={() => setIsAddOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {memberControls.paginatedData.map((member) => {
              const user = store.users.find((u) => u.id === member.user_id);
              if (!user) return null;

              const isMemberAdmin = member.role === "admin";
              const isSelf = user.id === activeUser.id;
              const userWallets = store.wallets.filter((w) => {
                if (isMemberAdmin) return true;
                return (
                  w.owner_user_id === user.id ||
                  store.walletAccess.some(
                    (wa) => wa.wallet_id === w.id && wa.user_id === user.id
                  )
                );
              });

              return (
                <Card key={member.user_id} className="relative overflow-hidden border-border/60">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${isMemberAdmin ? "bg-emerald-500" : "bg-blue-500"}`} />
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {user.name}
                        {isSelf && (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                            Anda
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={isMemberAdmin ? "default" : "secondary"} className="gap-1">
                        {isMemberAdmin ? (
                          <>
                            <ShieldCheckIcon className="size-3.5 text-emerald-400" /> Admin / Kepala Keluarga
                          </>
                        ) : (
                          <>
                            <UserIcon className="size-3.5 text-blue-400" /> Member / Pasangan
                          </>
                        )}
                      </Badge>

                      {/* Action Buttons for Admin */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="Edit Member"
                          onClick={() => openEditModal(member.user_id)}
                        >
                          <PencilSimpleIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus Member"}
                          disabled={isSelf}
                          onClick={() => setDeletingUserId(member.user_id)}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-2">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Mata Uang Acuan</span>
                        <span className="font-medium">{user.base_currency}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Izin Edit Transaksi Orang Lain</span>
                        <span className="font-medium flex items-center gap-1">
                          {member.can_edit_others_transactions ? (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <CheckCircleIcon className="size-3.5" /> Ya
                            </span>
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <XCircleIcon className="size-3.5" /> Tidak (Terisolasi)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Accessible Wallets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Dompet yang Dapat Diakses ({userWallets.length})
                        </Label>
                        {!isMemberAdmin && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary"
                              >
                                <KeyIcon className="size-3" />
                                Kelola Akses Dompet
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[450px]">
                              <DialogHeader>
                                <DialogTitle>Atur Akses Dompet — {user.name}</DialogTitle>
                                <DialogDescription>
                                  Pilih wallet mana saja yang dapat dilihat dan dipakai bertransaksi oleh {user.name}.
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-3 py-3">
                                {store.wallets.map((wallet) => {
                                  const hasAccess = store.walletAccess.some(
                                    (wa) => wa.wallet_id === wallet.id && wa.user_id === user.id
                                  ) || wallet.owner_user_id === user.id;

                                  const isOwner = wallet.owner_user_id === user.id;

                                  return (
                                    <div
                                      key={wallet.id}
                                      className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30"
                                    >
                                      <div className="space-y-0.5">
                                        <div className="font-medium text-sm flex items-center gap-2">
                                          {wallet.name}
                                          {isOwner && (
                                            <Badge variant="outline" className="text-[10px]">
                                              Pemilik
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Tipe: {wallet.type.toUpperCase()} | Saldo: Rp {wallet.balance.toLocaleString("id-ID")}
                                        </div>
                                      </div>

                                      <Checkbox
                                        checked={hasAccess}
                                        disabled={isOwner}
                                        onCheckedChange={() => store.toggleWalletAccess(wallet.id, user.id)}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {userWallets.map((w) => (
                          <Badge key={w.id} variant="secondary" className="text-xs font-normal">
                            {w.name} (Rp {w.balance.toLocaleString("id-ID")})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}

          <DataPagination
            page={memberControls.page}
            totalPages={memberControls.totalPages}
            totalItems={memberControls.totalItems}
            pageSize={memberControls.pageSize}
            onPageChange={memberControls.setPage}
          />
        </TabsContent>

        {/* Tab 2: Audit Logs */}
        <TabsContent value="audit-logs" className="pt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b">
              <div>
                <CardTitle className="text-lg">Audit Trail & Riwayat Aktivitas</CardTitle>
                <CardDescription>
                  Pencatatan aktivitas perubahan data sistem, penambahan anggota, dan akses dompet secara mutlak.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <DataTableToolbar
                searchQuery={auditControls.searchQuery}
                onSearchChange={auditControls.setSearchQuery}
                searchPlaceholder="Cari log aktivitas..."
                filters={auditControls.filters}
                onFilterChange={auditControls.setFilter}
                onClearFilters={auditControls.clearAllFilters}
                activeFilterCount={auditControls.activeFilterCount}
                sortOptions={auditSortOptions}
                currentSortIndex={auditSortIndex}
                onSortChange={(idx) => {
                  setAuditSortIndex(idx);
                  auditControls.setSortRules(auditSortOptions[idx].rules);
                }}
              />

              {hasAuditError ? (
                <ErrorState onRetry={loadAuditLogs} />
              ) : isAuditLoading ? (
                <DataTableSkeleton rows={5} cols={4} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Waktu</TableHead>
                      <TableHead>Pengguna (Actor)</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>Tipe Entity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditControls.paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="p-0">
                          <EmptyState
                            title="Belum Ada Log Aktivitas"
                            description="Belum ada pencatatan aktivitas atau perubahan sistem yang terekam."
                            isFiltered={auditControls.activeFilterCount > 0 || auditControls.searchQuery.trim() !== ""}
                            onReset={auditControls.clearAllFilters}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                    auditControls.paginatedData.map((log) => {
                      const actor = auditMembers.find((m) => m.user_id === log.actor_id);
                      return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="font-medium text-xs">{actor?.name || log.actor_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.entity_type}</TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              )}

              <DataPagination
                page={auditControls.page}
                totalPages={auditControls.totalPages}
                totalItems={auditControls.totalItems}
                pageSize={auditControls.pageSize}
                onPageChange={auditControls.setPage}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Member Modal */}
      <Dialog open={editingUserId !== null} onOpenChange={(open) => !open && setEditingUserId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateMember}>
            <DialogHeader>
              <DialogTitle>Edit Data Member</DialogTitle>
              <DialogDescription>
                Perbarui informasi profil, peran (Role), dan hak akses transaksi anggota keluarga.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nama Lengkap</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Peran (Role)</Label>
                <Select value={editRole} onValueChange={(val: UserRole) => setEditRole(val)}>
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin / Kepala Keluarga</SelectItem>
                    <SelectItem value="member">Member / Pasangan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between space-x-2 pt-2 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-permission-switch" className="text-sm font-medium">
                    Izin Edit Transaksi Anggota Lain
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Izinkan member ini mengedit/void transaksi milik anggota keluarga lain.
                  </p>
                </div>
                <Switch
                  id="edit-permission-switch"
                  checked={editCanEditOthers}
                  onCheckedChange={setEditCanEditOthers}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingUserId(null)}>
                Batal
              </Button>
              <Button type="submit">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation Alert Dialog */}
      <AlertDialog open={deletingUserId !== null} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <WarningIcon className="size-5 shrink-0" />
              <AlertDialogTitle>Konfirmasi Hapus Member</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                Apakah Anda yakin ingin mengeluarkan{" "}
                <strong className="text-foreground">
                  {store.users.find((u) => u.id === deletingUserId)?.name}
                </strong>{" "}
                dari Household?
              </p>
              <div className="p-3 bg-muted/60 rounded-lg text-xs border border-border/50 text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">• Akses dompet akan dicabut seketika.</p>
                <p>• Data histori transaksi dan saldo wallet milik member ini akan tetap aman tersimpan di sistem.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUserId(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteMember}
            >
              Ya, Hapus Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
