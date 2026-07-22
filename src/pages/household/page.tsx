import React, { useState } from "react";
import { useMockStore } from "@/lib/mock-store";
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

export default function HouseholdPage() {
  const store = useMockStore();
  const isAdmin = store.activeRole === "admin";
  const activeUser = store.getActiveUser();

  // Add Member State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [canEditOthers, setCanEditOthers] = useState(false);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName || !memberEmail) return;
    store.addMember(memberName, memberEmail, canEditOthers);
    setMemberName("");
    setMemberEmail("");
    setCanEditOthers(false);
    setIsAddOpen(false);
  };

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

        {isAdmin ? (
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
        ) : (
          <div className="flex items-center gap-2 text-xs bg-muted/60 text-muted-foreground px-3 py-2 rounded-lg border border-border/40">
            <InfoIcon className="size-4 text-blue-500 shrink-0" />
            <span>Hanya Kepala Keluarga (Admin) yang dapat menambah anggota dan mengeset hak akses dompet.</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="members" className="gap-2">
            <UsersThreeIcon className="size-4" />
            Anggota & Hak Akses
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="gap-2">
            <ListDashesIcon className="size-4" />
            Audit Logs ({store.auditLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Members & Access */}
        <TabsContent value="members" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {store.members.map((member) => {
              const user = store.users.find((u) => u.id === member.user_id);
              if (!user) return null;

              const isMemberAdmin = member.role === "admin";
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
                        {user.id === activeUser.id && (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                            Anda
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
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
                        {isAdmin && !isMemberAdmin && (
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
        </TabsContent>

        {/* Tab 2: Audit Logs */}
        <TabsContent value="audit-logs" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Trail & Riwayat Aktivitas</CardTitle>
              <CardDescription>
                Pencatatan aktivitas perubahan data sistem, penambahan anggota, dan akses dompet secara mutlak.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Waktu</TableHead>
                    <TableHead>Pengguna (Actor)</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Tipe Entity</TableHead>
                    <TableHead>Detail Perubahan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Belum ada log aktivitas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    store.auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.created_at}
                        </TableCell>
                        <TableCell className="font-medium text-xs">{log.actor_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.entity_type}</TableCell>
                        <TableCell className="text-xs">{log.details}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
