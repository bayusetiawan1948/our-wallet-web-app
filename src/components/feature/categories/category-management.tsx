import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import * as categoriesService from "@/services/categories.service";
import { useAuth } from "@/contexts/auth-context";
import { type Category, type CategoryType } from "@/types";
import { useDataControls, type FilterConfig } from "@/hooks/use-data-controls";
import { DataTableToolbar } from "@/components/common/data-table-toolbar";
import { DataPagination } from "@/components/common/data-table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { DataTableSkeleton } from "@/components/common/loading-skeleton";
import { ErrorState } from "@/components/common/error-state";
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
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadCategories = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    categoriesService
      .listCategories()
      .then(setCategories)
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Form Dialog state (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<CategoryType>("expense");
  const [formIcon, setFormIcon] = useState("Tag");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Alert Dialog state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await categoriesService.updateCategory(editingCategory.id, {
          name: formName,
          type: formType,
          icon: formIcon,
          is_hidden: !formIsActive,
        });
        toast.success(`Kategori "${formName}" berhasil diperbarui!`);
      } else {
        await categoriesService.createCategory({
          name: formName,
          type: formType,
          icon: formIcon,
        });
        toast.success(`Kategori "${formName}" berhasil dibuat!`);
      }
      setIsFormOpen(false);
      loadCategories();
    } catch {
      toast.error("Gagal menyimpan kategori. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      await categoriesService.deleteCategory(deletingCategory.id);
      toast.success(`Kategori "${deletingCategory.name}" berhasil dihapus!`);
      setDeletingCategory(null);
      loadCategories();
    } catch {
      toast.error("⚠️ KATEGORI TIDAK DAPAT DIHAPUS!", {
        description: `Kategori "${deletingCategory.name}" masih terikat dengan data lain atau merupakan kategori sistem.`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await categoriesService.toggleCategoryStatus(category.id);
      toast.info(`Kategori "${category.name}" sekarang ${category.is_active ? "Non-aktif" : "Aktif"}`);
      loadCategories();
    } catch {
      toast.error("Gagal mengubah status kategori.");
    }
  };

  // Filter categories with useDataControls
  const catFilterConfigs = useMemo<FilterConfig<Category>[]>(() => {
    return [
      {
        id: "type",
        label: "Tipe",
        type: "select",
        options: [
          { label: "Pemasukan", value: "income" },
          { label: "Pengeluaran", value: "expense" },
          { label: "Pemasukan & Pengeluaran", value: "both" },
        ],
      },
      {
        id: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Aktif", value: "active" },
          { label: "Non-aktif", value: "inactive" },
        ],
      },
    ];
  }, []);

  const catSortOptions = useMemo(() => {
    return [
      { label: "Nama (A - Z)", rules: [{ field: "name", order: "asc" as const }] },
      { label: "Nama (Z - A)", rules: [{ field: "name", order: "desc" as const }] },
      { label: "Tipe", rules: [{ field: "type", order: "asc" as const }] },
    ];
  }, []);

  const [catSortIndex, setCatSortIndex] = useState(0);

  const catControls = useDataControls<Category>({
    data: categories,
    searchFields: ["name", "id"],
    searchPredicate: (item, q) => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q),
    initialSort: catSortOptions[0].rules,
    initialPageSize: 10,
  });

  // Statistics
  const totalCategories = categories.length;
  const incomeCategoriesCount = categories.filter((c) => c.type === "income").length;
  const expenseCategoriesCount = categories.filter((c) => c.type === "expense").length;
  const bothCategoriesCount = categories.filter((c) => c.type === "both").length;

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
        <CardContent className="p-4">
          <DataTableToolbar
            searchQuery={catControls.searchQuery}
            onSearchChange={catControls.setSearchQuery}
            searchPlaceholder="Cari nama kategori atau ID..."
            filterConfigs={catFilterConfigs}
            filters={catControls.filters}
            onFilterChange={catControls.setFilter}
            onClearFilters={catControls.clearAllFilters}
            activeFilterCount={catControls.activeFilterCount}
            sortOptions={catSortOptions}
            currentSortIndex={catSortIndex}
            onSortChange={(idx) => {
              setCatSortIndex(idx);
              catControls.setSortRules(catSortOptions[idx].rules);
            }}
          />
        </CardContent>
      </Card>

      {/* Category Table List */}
      <Card className="shadow-none border-border/60 overflow-hidden">
        {hasError ? (
          <ErrorState onRetry={loadCategories} />
        ) : isLoading ? (
          <DataTableSkeleton rows={5} cols={6} />
        ) : (
          <CardContent className="p-0">
            <Table className="border-b border-border/60">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[60px]">Ikon</TableHead>
                <TableHead>Nama Kategori</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catControls.paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={TagIcon}
                      title="Tidak Ada Kategori"
                      description="Belum ada kategori transaksi yang terdaftar atau cocok dengan pencarian."
                      isFiltered={catControls.activeFilterCount > 0 || catControls.searchQuery.trim() !== ""}
                      onReset={catControls.clearAllFilters}
                      actionLabel={isAdmin ? "Tambah Kategori Baru" : undefined}
                      onAction={isAdmin ? openCreateDialog : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                catControls.paginatedData.map((category) => {
                const IconComp = getCategoryIcon(category.icon);

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
                              onCheckedChange={() => handleToggleStatus(category)}
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
          <div className="p-4 border-t">
            <DataPagination
              page={catControls.page}
              totalPages={catControls.totalPages}
              totalItems={catControls.totalItems}
              pageSize={catControls.pageSize}
              onPageChange={catControls.setPage}
            />
          </div>
        </CardContent>
      )}
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

              <Button type="submit" disabled={isSubmitting}>
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
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Kategori akan dihapus secara permanen. Jika kategori masih dipakai oleh transaksi, anggaran, atau sub-kategori, penghapusan akan ditolak oleh sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
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
