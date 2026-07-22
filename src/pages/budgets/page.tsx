import React, { useState } from "react";
import { useMockStore } from "@/lib/mock-store";
import {
  TargetIcon,
  PlusIcon,
  WarningIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BudgetPeriod } from "@/types";

export default function BudgetsPage() {
  const store = useMockStore();

  // Add Budget State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [budCatId, setBudCatId] = useState<string>(store.categories[0]?.id || "");
  const [budName, setBudName] = useState<string>("");
  const [budTarget, setBudTarget] = useState<string>("");
  const [budPeriod, setBudPeriod] = useState<BudgetPeriod>("monthly");

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budCatId || !budName || !budTarget) return;

    const targetVal = parseFloat(budTarget) || 0;
    const newBudget = {
      id: `b-${Date.now()}`,
      category_id: budCatId,
      owner_household_id: "household-1",
      name: budName,
      target_amount: targetVal,
      period: budPeriod,
      start_date: new Date().toISOString().split("T")[0],
    };

    store.addBudget(newBudget);
    setBudName("");
    setBudTarget("");
    setIsAddOpen(false);
  };

  return (
    <div className="py-8 px-6 sm:px-8 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/60 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TargetIcon className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Anggaran / Budgets Per Kategori</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Bagi dan batasi batas pengeluaran keluarga per periode dengan indikator persentase pemakaian real-time.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusIcon className="size-4" />
              Buat Budget Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddBudget}>
              <DialogHeader>
                <DialogTitle>Buat Budget Baru</DialogTitle>
                <DialogDescription>
                  Tentukan batas maksimum pengeluaran untuk kategori tertentu.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nama Budget</Label>
                  <Input
                    placeholder="Contoh: Budget Makan & Kuliner"
                    value={budName}
                    onChange={(e) => setBudName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Pilih Kategori</Label>
                  <Select value={budCatId} onValueChange={setBudCatId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {store.categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Target Batas (Rp)</Label>
                    <Input
                      type="number"
                      placeholder="3000000"
                      value={budTarget}
                      onChange={(e) => setBudTarget(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Periode</Label>
                    <Select value={budPeriod} onValueChange={(val: BudgetPeriod) => setBudPeriod(val)}>
                      <SelectTrigger>
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
              </div>

              <DialogFooter>
                <Button type="submit">Simpan Budget</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budgets Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {store.budgets.map((budget) => {
          const category = store.categories.find((c) => c.id === budget.category_id);

          const spent = store.transactions
            .filter((t) => t.category_id === budget.category_id && t.type === "expense" && t.status === "active")
            .reduce((sum, t) => sum + t.amount, 0);

          const remaining = budget.target_amount - spent;
          const pct = Math.min(100, Math.round((spent / budget.target_amount) * 100));
          const isOver = spent > budget.target_amount;
          const isWarning = pct >= 80 && !isOver;

          return (
            <Card key={budget.id} className="relative overflow-hidden border-border/60">
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"}`} />
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-semibold">{budget.name}</CardTitle>
                  <CardDescription>Kategori: {category?.name || "-"}</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs uppercase">
                  {budget.period}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-muted-foreground">Terpakai:</span>
                    <span className="font-bold font-mono text-sm">
                      Rp {spent.toLocaleString("id-ID")}{" "}
                      <span className="font-normal text-muted-foreground text-xs">/ Rp {budget.target_amount.toLocaleString("id-ID")}</span>
                    </span>
                  </div>

                  <Progress value={pct} className={`h-2.5 ${isOver ? "[&>div]:bg-rose-500" : isWarning ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`} />

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="font-semibold">{pct}% Terpakai</span>
                    {isOver ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <WarningIcon className="size-3.5" /> OVER Rp {Math.abs(remaining).toLocaleString("id-ID")}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">
                        Sisa: Rp {remaining.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="pt-2 border-t border-border/40 text-xs flex items-center justify-between">
                  <span className="text-muted-foreground">Status Anggaran</span>
                  {isOver ? (
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <WarningIcon className="size-3" /> OVERBUDGET
                    </Badge>
                  ) : isWarning ? (
                    <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-500/40 bg-amber-500/10">
                      <WarningIcon className="size-3" /> Mendekati Batas
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] gap-1 text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      <CheckCircleIcon className="size-3" /> Aman
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
