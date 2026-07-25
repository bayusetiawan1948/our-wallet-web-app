import React, { useState, useMemo } from "react";
import { useMockStore } from "@/lib/mock-store";
import { type Category, type CategoryType } from "@/types";
import {
  MoneyIcon,
  BriefcaseIcon,
  ForkKnifeIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  CarIcon,
  FilmScriptIcon,
  FirstAidIcon,
  PiggyBankIcon,
  LightningIcon,
  TrendUpIcon,
  GiftIcon,
  TagIcon,
  HeartIcon,
  HouseIcon,
  AirplaneIcon,
  GraduationCapIcon,
  GameControllerIcon,
  WrenchIcon,
  ShieldIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LockIcon,
  XIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Money: MoneyIcon,
  Briefcase: BriefcaseIcon,
  ForkKnife: ForkKnifeIcon,
  Receipt: ReceiptIcon,
  ShoppingCart: ShoppingCartIcon,
  Car: CarIcon,
  Film: FilmScriptIcon,
  FirstAid: FirstAidIcon,
  PiggyBank: PiggyBankIcon,
  Lightning: LightningIcon,
  TrendUp: TrendUpIcon,
  Gift: GiftIcon,
  Tag: TagIcon,
  Heart: HeartIcon,
  House: HouseIcon,
  Airplane: AirplaneIcon,
  GraduationCap: GraduationCapIcon,
  GameController: GameControllerIcon,
  Wrench: WrenchIcon,
  Shield: ShieldIcon,
};

export function getCategoryIcon(iconName?: string): React.ElementType {
  if (iconName && CATEGORY_ICONS[iconName]) {
    return CATEGORY_ICONS[iconName];
  }
  return TagIcon;
}

export function CategoryManagement() {
  const store = useMockStore();
  const isAdmin = store.activeRole === "admin";

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form Dialog state (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<CategoryType>("expense");
  const [formIcon, setFormIcon] = useState("Tag");
  const [formIsActive, setFormIsActive] = useState(true);

  // Delete Alert Dialog state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormName("");
    setFormType("expense");
    setFormIcon("Tag");
    setFormIsActive(true);
    setIsFormOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormType(category.type);
    setFormIcon(category.icon || "Tag");
    setFormIsActive(category.is_active);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCategory) {
      const success = store.updateCategory(editingCategory.id, {
        name: formName,
        type: formType,
        icon: formIcon,
        is_active: formIsActive,
      });
      if (success) setIsFormOpen(false);
    } else {
      const success = store.addCategory({
        name: formName,
        type: formType,
        icon: formIcon,
      });
      if (success) setIsFormOpen(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return;
    store.deleteCategory(deletingCategory.id);
    setDeletingCategory(null);
  };

  // Filter categories
  const filteredCategories = useMemo(() => {
    return store.categories.filter((cat) => {
      // Search
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      let matchesType = true;
      if (filterType !== "all") {
        matchesType = cat.type === filterType;
      }

      // Status filter
      let matchesStatus = true;
      if (filterStatus === "active") matchesStatus = cat.is_active;
      if (filterStatus === "inactive") matchesStatus = !cat.is_active;
      if (filterStatus === "system") matchesStatus = cat.is_system;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [store.categories, searchQuery, filterType, filterStatus]);

  // Statistics
  const totalCategories = store.categories.length;
  const incomeCategoriesCount = store.categories.filter((c) => c.type === "income").length;
  const expenseCategoriesCount = store.categories.filter((c) => c.type === "expense").length;
  const bothCategoriesCount = store.categories.filter((c) => c.type === "both").length;

  return (
    <div className="space-y-6">
      {/* Header Banner & Role Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TagIcon className="size-6 text-primary" />
            Kelola Kategori Transaksi
          </h2>
          <p className="text-sm text-muted-foreground">
            Kelola kategori pemasukan & pengeluaran keuangan keluarga Anda.
          </p>
        </div>

        {isAdmin ? (
          <Button onClick={openCreateDialog} className="shrink-0 gap-2">
            <PlusIcon className="size-4" />
            Tambah Kategori Baru
          </Button>
        ) : (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 py-1.5 px-3">
            <LockIcon className="size-3.5 mr-1.5 inline" />
            Mode Lihat Saja (Khusus Admin)
          </Badge>
        )}
      </div>

      {!isAdmin && (
        <Alert variant="default" className="bg-muted/50 border-muted">
          <InfoIcon className="size-4 text-muted-foreground" />
          <AlertTitle className="text-sm font-semibold">Akses Terbatas</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Anda berada dalam role <strong>Member</strong>. Penambahan, pengubahan, atau penghapusan kategori hanya dapat dilakukan oleh <strong>Admin / Kepala Keluarga</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/50 shadow-none border-border/60">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs">Total Kategori</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{totalCategories}</div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 dark:bg-emerald-500/10 shadow-none border-emerald-500/20">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs text-emerald-600 dark:text-emerald-400">Pemasukan</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{incomeCategoriesCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-rose-500/5 dark:bg-rose-500/10 shadow-none border-rose-500/20">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs text-rose-600 dark:text-rose-400">Pengeluaran</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{expenseCategoriesCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-500/5 dark:bg-indigo-500/10 shadow-none border-indigo-500/20">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs text-indigo-600 dark:text-indigo-400">Pemasukan & Pengeluaran</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{bothCategoriesCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="shadow-none border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div className="w-full sm:w-48 shrink-0">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="text-xs">
                  <FunnelIcon className="size-3.5 mr-2 text-muted-foreground inline" />
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="income">🟢 Pemasukan saja</SelectItem>
                  <SelectItem value="expense">🔴 Pengeluaran saja</SelectItem>
                  <SelectItem value="both">🔵 Pemasukan & Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44 shrink-0">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Non-aktif</SelectItem>
                  <SelectItem value="system">Bawaan Sistem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Table List */}
      <Card className="shadow-none border-border/60 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[60px]">Ikon</TableHead>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Penggunaan Data</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                  Tidak ada kategori yang cocok dengan filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => {
                const IconComp = getCategoryIcon(category.icon);
                const trackRecord = store.hasCategoryTrackRecord(category.id);

                return (
                  <TableRow key={category.id} className={!category.is_active ? "opacity-60 bg-muted/20" : ""}>
                    {/* Icon */}
                    <TableCell>
                      <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <IconComp className="size-5" />
                      </div>
                    </TableCell>

                    {/* Name */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          {category.name}
                          {category.is_system && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium">
                              Sistem
                            </Badge>
                          )}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          ID: {category.id}
                        </span>
                      </div>
                    </TableCell>

                    {/* Type Badge */}
                    <TableCell>
                      {category.type === "income" && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                          Pemasukan
                        </Badge>
                      )}
                      {category.type === "expense" && (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-medium">
                          Pengeluaran
                        </Badge>
                      )}
                      {category.type === "both" && (
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-medium">
                          Pemasukan & Pengeluaran
                        </Badge>
                      )}
                    </TableCell>

                    {/* Active Status Switch / Badge */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={category.is_active}
                              disabled={category.is_system}
                              onCheckedChange={() => store.toggleCategoryStatus(category.id)}
                            />
                            <span className="text-xs font-medium">
                              {category.is_active ? (
                                <span className="text-emerald-600 dark:text-emerald-400">Aktif</span>
                              ) : (
                                <span className="text-muted-foreground">Non-aktif</span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Aktif" : "Non-aktif"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Track Record */}
                    <TableCell>
                      {trackRecord.hasRecord ? (
                        <span className="text-xs text-muted-foreground font-medium">
                          {trackRecord.details.join(", ")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">Belum terpakai</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(category)}
                            title="Edit Kategori"
                          >
                            <PencilIcon className="size-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 disabled:opacity-40"
                            disabled={category.is_system}
                            onClick={() => setDeletingCategory(category)}
                            title={
                              category.is_system
                                ? "Kategori sistem tidak dapat dihapus"
                                : "Hapus Kategori"
                            }
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add / Edit Category Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TagIcon className="size-5 text-primary" />
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Ubah atribut nama, tipe transaksi, atau ikon kategori."
                  : "Buat kategori transaksi baru untuk pencatatan keuangan keluarga."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <Label htmlFor="cat-name" className="text-xs font-semibold">
                  Nama Kategori <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="cat-name"
                  placeholder="Misal: Investasi Rutin, Hadiah, Listrik"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              {/* Category Type */}
              <div className="space-y-1.5">
                <Label htmlFor="cat-type" className="text-xs font-semibold">
                  Tipe Transaksi <span className="text-rose-500">*</span>
                </Label>
                <Select value={formType} onValueChange={(val: CategoryType) => setFormType(val)}>
                  <SelectTrigger id="cat-type" className="w-full">
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">🔴 Pengeluaran Saja</SelectItem>
                    <SelectItem value="income">🟢 Pemasukan Saja</SelectItem>
                    <SelectItem value="both">🔵 Pemasukan & Pengeluaran (Kedua-duanya)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status (Edit mode only for non-system) */}
              {editingCategory && !editingCategory.is_system && (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Status Kategori</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Kategori non-aktif tidak akan muncul di pilihan pencatatan transaksi baru.
                    </p>
                  </div>
                  <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                </div>
              )}

              {/* Phosphor Icon Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Pilih Ikon (Phosphor Icon)</Label>
                <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1.5 border border-border rounded-lg bg-muted/20">
                  {Object.keys(CATEGORY_ICONS).map((iconKey) => {
                    const IconComponent = CATEGORY_ICONS[iconKey];
                    const isSelected = formIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormIcon(iconKey)}
                        className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs gap-1 border ${isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card hover:bg-muted text-muted-foreground border-border/40"
                          }`}
                      >
                        <IconComponent className="size-5" />
                        <span className="text-[9px] truncate max-w-full">{iconKey}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Batal
              </Button>

              <Button type="submit">
                {editingCategory ? "Simpan Perubahan" : "Buat Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <TrashIcon className="size-5" />
              Hapus Kategori "{deletingCategory?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>Tindakan ini tidak dapat dibatalkan. Kategori akan dihapus secara permanen.</span>
              {deletingCategory && store.hasCategoryTrackRecord(deletingCategory.id).hasRecord && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md text-xs text-rose-700 dark:text-rose-300">
                  ⚠️ <strong>Peringatan Data Terikat:</strong> Kategori ini saat ini masih memiliki {store.hasCategoryTrackRecord(deletingCategory.id).details.join(", ")}. Penghapusan akan ditolak oleh sistem untuk menjaga integritas data.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Hapus Kategori
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
