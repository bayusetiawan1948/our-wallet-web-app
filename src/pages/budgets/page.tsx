import { useState, useMemo } from "react";
import { useMockStore } from "@/lib/mock-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TargetIcon,
  PlusIcon,
  WarningIcon,
  ClockIcon,
  ScalesIcon,
  WalletIcon,
  PencilSimpleIcon,
  TrashIcon,
  ArrowsClockwiseIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import { BudgetFormDialog } from "@/components/feature/budgets/budget-form-dialog";
import { GoalFormDialog } from "@/components/feature/budgets/goal-form-dialog";
import { EncroachmentHistoryDialog } from "@/components/feature/budgets/encroachment-history-dialog";
import type { Budget, Goal } from "@/types";

export default function BudgetsPage() {
  const store = useMockStore();

  // Dialog State
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const [isEncroachmentHistoryOpen, setIsEncroachmentHistoryOpen] = useState(false);
  const [historyTargetBudget, setHistoryTargetBudget] = useState<Budget | null>(null);
  const [historyTargetGoal, setHistoryTargetGoal] = useState<Goal | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"budgets" | "goals">("budgets");

  // Summary Metrics for Budgets
  const budgetSummaries = useMemo(() => {
    return store.budgets.map((b) => store.getBudgetProgress(b.id)).filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.budgets, store.transactions, store.budgetPeriods, store.reservations]);

  const totalBudgetTarget = budgetSummaries.reduce((sum, item) => sum + (item?.effectiveTarget || 0), 0);
  const totalBudgetSpent = budgetSummaries.reduce((sum, item) => sum + (item?.spentAmount || 0), 0);
  const totalCarriedDeficit = budgetSummaries.reduce((sum, item) => sum + (item?.carriedDeficit || 0), 0);
  const totalBudgetReservations = budgetSummaries.reduce((sum, item) => sum + (item?.totalReserved || 0), 0);

  // Summary Metrics for Goals
  const goalSummaries = useMemo(() => {
    return store.goals.map((g) => store.getGoalProgress(g.id)).filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.goals, store.reservations]);

  const totalGoalTarget = goalSummaries.reduce((sum, item) => sum + (item?.goal.target_amount || 0), 0);
  const totalGoalReserved = goalSummaries.reduce((sum, item) => sum + (item?.totalReserved || 0), 0);
  const averageGoalProgress = goalSummaries.length > 0
    ? Math.round(goalSummaries.reduce((sum, item) => sum + (item?.progressPercent || 0), 0) / goalSummaries.length)
    : 0;

  // Handlers for Budget
  const handleOpenAddBudget = () => {
    setBudgetToEdit(null);
    setIsBudgetFormOpen(true);
  };

  const handleOpenEditBudget = (budget: Budget) => {
    setBudgetToEdit(budget);
    setIsBudgetFormOpen(true);
  };

  const handleCloseBudgetPeriod = (budgetId: string) => {
    store.closeBudgetPeriod(budgetId);
  };

  // Handlers for Goal
  const handleOpenAddGoal = () => {
    setGoalToEdit(null);
    setIsGoalFormOpen(true);
  };

  const handleOpenEditGoal = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsGoalFormOpen(true);
  };

  // Handlers for Encroachment History
  const handleOpenBudgetEncroachmentHistory = (budget: Budget) => {
    setHistoryTargetBudget(budget);
    setHistoryTargetGoal(null);
    setIsEncroachmentHistoryOpen(true);
  };

  const handleOpenGoalEncroachmentHistory = (goal: Goal) => {
    setHistoryTargetGoal(goal);
    setHistoryTargetBudget(null);
    setIsEncroachmentHistoryOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-12 xl:pb-8">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <TargetIcon className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <span className="truncate">Budget & Financial Goals</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Kelola budget berulang per periode dan target pengumpulan dana jangka panjang secara terpisah.
          </p>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-0 border-border/50 shrink-0">
          {activeTab === "budgets" ? (
            <Button
              onClick={handleOpenAddBudget}
              className="w-full sm:w-auto bg-primary text-primary-foreground font-medium gap-2 shadow-xs transition-all hover:shadow-md h-10 px-4"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Buat Budget Baru</span>
            </Button>
          ) : (
            <Button
              onClick={handleOpenAddGoal}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 shadow-xs transition-all hover:shadow-md h-10 px-4"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Buat Goal Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "budgets" | "goals")}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full sm:w-fit sm:min-w-[380px] grid-cols-2 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="budgets" className="gap-2 font-medium text-xs sm:text-sm rounded-lg px-3">
            <TargetIcon className="" />
            <span className="truncate">Budget Berulang ({store.budgets.length})</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2 font-medium text-xs sm:text-sm rounded-lg px-3">
            <TrendUpIcon className="" />
            <span className="truncate">Financial Goals ({store.goals.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BUDGET BERULANG */}
        <TabsContent value="budgets" className="space-y-6 focus-visible:outline-none">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border/70 hover:border-border transition-colors shadow-2xs">
              <CardHeader className="p-4.5 pb-2">
                <CardDescription className="text-xs font-medium">Total Target Budget (Periode Ini)</CardDescription>
                <CardTitle className="text-lg sm:text-xl font-bold font-mono text-foreground tracking-tight">
                  Rp {totalBudgetTarget.toLocaleString("id-ID")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4.5 pt-0">
                <span className="text-[11px] text-muted-foreground leading-tight block">
                  Termasuk carried deficit periode lalu
                </span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/70 hover:border-border transition-colors shadow-2xs">
              <CardHeader className="p-4.5 pb-2">
                <CardDescription className="text-xs font-medium">Realisasi Pengeluaran</CardDescription>
                <CardTitle className="text-lg sm:text-xl font-bold font-mono text-foreground tracking-tight">
                  Rp {totalBudgetSpent.toLocaleString("id-ID")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4.5 pt-0">
                <span className="text-[11px] text-muted-foreground leading-tight block">
                  Progres: {totalBudgetTarget > 0 ? Math.round((totalBudgetSpent / totalBudgetTarget) * 100) : 0}% dari target
                </span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/70 hover:border-border transition-colors shadow-2xs">
              <CardHeader className="p-4.5 pb-2">
                <CardDescription className="text-xs font-medium">Defisit Terbawa (Carried Forward)</CardDescription>
                <CardTitle className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
                  Rp {totalCarriedDeficit.toLocaleString("id-ID")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4.5 pt-0">
                <span className="text-[11px] text-muted-foreground leading-tight block">
                  Beban tambahan dari periode sebelumnya
                </span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/70 hover:border-border transition-colors shadow-2xs">
              <CardHeader className="p-4.5 pb-2">
                <CardDescription className="text-xs font-medium">Total Reservasi Terkunci</CardDescription>
                <CardTitle className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  Rp {totalBudgetReservations.toLocaleString("id-ID")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4.5 pt-0">
                <span className="text-[11px] text-muted-foreground leading-tight block">
                  Dana yang dicadangkan di dompet-dompet
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Budget List Cards */}
          {store.budgets.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center border-dashed rounded-2xl">
              <TargetIcon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-lg">Belum Ada Budget Berulang</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                Buat budget pertama Anda untuk mengontrol pengeluaran rutin mingguan, bulanan, atau tahunan per kategori.
              </p>
              <Button onClick={handleOpenAddBudget} className="mt-4 gap-2">
                <PlusIcon className="w-4 h-4" />
                Buat Budget Sekarang
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {store.budgets.map((budget) => {
                const progress = store.getBudgetProgress(budget.id);
                if (!progress) return null;

                const category = store.categories.find((c) => c.id === budget.category_id);
                const percent = Math.min(100, Math.round((progress.spentAmount / (progress.effectiveTarget || 1)) * 100));

                return (
                  <Card
                    key={budget.id}
                    className="bg-card border-border/80 hover:border-primary/40 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between rounded-2xl overflow-hidden"
                  >
                    <CardHeader className="p-5 pb-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-bold text-foreground">
                            {budget.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Kategori: <strong className="text-foreground">{category?.name || "Expense"}</strong>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider shrink-0">
                          {budget.period === "weekly" ? "Mingguan" : budget.period === "monthly" ? "Bulanan" : "Tahunan"}
                        </Badge>
                      </div>

                      {/* Overbudget & Carried Deficit Warnings */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {progress.carriedDeficit > 0 && (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] gap-1">
                            <WarningIcon className="w-3 h-3" />
                            Defisit Terbawa: Rp {progress.carriedDeficit.toLocaleString("id-ID")}
                          </Badge>
                        )}
                        {progress.isOverbudget && (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <WarningIcon className="w-3 h-3" />
                            Overbudget Rp {progress.deficitAmount.toLocaleString("id-ID")}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-4">
                      {/* Progres Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Realisasi Pengeluaran</span>
                          <span className="font-mono font-bold text-foreground">
                            {percent}% (Rp {progress.spentAmount.toLocaleString("id-ID")})
                          </span>
                        </div>
                        <Progress
                          value={percent}
                          className={`h-2 ${progress.isOverbudget ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"}`}
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                          <span>Target Base: Rp {progress.baseTarget.toLocaleString("id-ID")}</span>
                          <span>Total Target: Rp {progress.effectiveTarget.toLocaleString("id-ID")}</span>
                        </div>
                      </div>

                      {/* Breakdown Reservasi Dompet (Many-to-Many) */}
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Dompet Penampung Reservasi ({progress.reservations.length})
                        </span>
                        {progress.reservations.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Belum ada reservasi dompet terikat.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {progress.reservations.map((res) => {
                              const wallet = store.wallets.find((w) => w.id === res.wallet_id);
                              return (
                                <div
                                  key={res.id}
                                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <WalletIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="font-medium text-foreground truncate">{wallet?.name || "Wallet"}</span>
                                  </div>
                                  <span className="font-mono text-muted-foreground shrink-0 pl-2">
                                    Rp {res.reserved_amount.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <div className="flex items-center justify-between sm:justify-start gap-1 w-full sm:w-auto">
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditBudget(budget)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                              title="Edit Budget"
                            >
                              <PencilSimpleIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => store.deleteBudget(budget.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              title="Hapus Budget"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>

                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenBudgetEncroachmentHistory(budget)}
                            className="text-[11px] gap-1 h-8 px-2.5 shrink-0"
                          >
                            <ScalesIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Log Encroachment</span>
                          </Button>
                        </div>

                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleCloseBudgetPeriod(budget.id)}
                          className="text-[11px] gap-1.5 h-8 px-3 justify-center w-full sm:w-auto shrink-0"
                          title="Tutup periode ini & bawa sisa defisit ke periode baru"
                        >
                          <ArrowsClockwiseIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>Reset Periode</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: FINANCIAL GOALS */}
        <TabsContent value="goals" className="space-y-6 focus-visible:outline-none">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border/70 hover:border-border transition-colors shadow-2xs">
              <CardHeader className="p-4.5 pb-2">
                <CardDescription className="text-xs font-medium">Total Target Financial Goals</CardDescription>
                <CardTitle className="text-lg sm:text-xl font-bold font-mono text-foreground tracking-tight">
                  Rp {totalGoalTarget.toLocaleString("id-ID")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4.5 pt-0">
                <span className="text-[11px] text-muted-foreground leading-tight block">
                  Total sasaran akumulasi dana
                </span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/70 hover:border-border transition-colors shadow-2xs">
              <CardHeader className="p-4.5 pb-2">
                <CardDescription className="text-xs font-medium">Dana Terkumpul (Reservasi Active)</CardDescription>
                <CardTitle className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  Rp {totalGoalReserved.toLocaleString("id-ID")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4.5 pt-0">
                <span className="text-[11px] text-muted-foreground leading-tight block">
                  Dana riil terkunci di dompet penampung
                </span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/70 hover:border-border transition-colors shadow-2xs">
              <CardHeader className="p-4.5 pb-2">
                <CardDescription className="text-xs font-medium">Progres Rata-rata Goals</CardDescription>
                <CardTitle className="text-lg sm:text-xl font-bold font-mono text-primary tracking-tight">
                  {averageGoalProgress}%
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4.5 pt-0">
                <span className="text-[11px] text-muted-foreground leading-tight block">
                  Dari total {store.goals.length} target aktif
                </span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/70 hover:border-border transition-colors shadow-2xs">
              <CardHeader className="p-4.5 pb-2">
                <CardDescription className="text-xs font-medium">Sisa Target Akumulasi</CardDescription>
                <CardTitle className="text-lg sm:text-xl font-bold font-mono text-muted-foreground tracking-tight">
                  Rp {Math.max(0, totalGoalTarget - totalGoalReserved).toLocaleString("id-ID")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4.5 pt-0">
                <span className="text-[11px] text-muted-foreground leading-tight block">
                  Kekurangan nominal menuju target 100%
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Goal List Cards */}
          {store.goals.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center border-dashed rounded-2xl">
              <TrendUpIcon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-lg">Belum Ada Financial Goal</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                Buat goal pertama Anda seperti Dana Darurat, DP Rumah, atau Renovasi untuk mengumpulkan dana secara bertahap tanpa reset periodik.
              </p>
              <Button onClick={handleOpenAddGoal} className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <PlusIcon className="w-4 h-4" />
                Buat Financial Goal
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {store.goals.map((goal) => {
                const progress = store.getGoalProgress(goal.id);
                if (!progress) return null;

                return (
                  <Card
                    key={goal.id}
                    className="bg-card border-border/80 hover:border-emerald-500/40 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between rounded-2xl overflow-hidden"
                  >
                    <CardHeader className="p-5 pb-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-bold text-foreground">
                            {goal.name}
                          </CardTitle>
                          {goal.target_date && (
                            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <ClockIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                              Target Date: <strong className="text-foreground">{goal.target_date}</strong>
                            </CardDescription>
                          )}
                        </div>
                        <Badge
                          variant={
                            goal.status === "completed"
                              ? "default"
                              : goal.status === "cancelled"
                                ? "destructive"
                                : "outline"
                          }
                          className="text-[10px] uppercase font-mono shrink-0"
                        >
                          {goal.status === "completed"
                            ? "Selesai"
                            : goal.status === "cancelled"
                              ? "Dibatalkan"
                              : "Aktif"}
                        </Badge>
                      </div>

                      {goal.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic pt-0.5">
                          "{goal.notes}"
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-4">
                      {/* Progres Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Dana Terkumpul (Reservasi)</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {progress.progressPercent}% (Rp {progress.totalReserved.toLocaleString("id-ID")})
                          </span>
                        </div>
                        <Progress
                          value={progress.progressPercent}
                          className="h-2 [&>div]:bg-emerald-500"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                          <span>Target: Rp {goal.target_amount.toLocaleString("id-ID")}</span>
                          <span>Sisa: Rp {progress.remainingAmount.toLocaleString("id-ID")}</span>
                        </div>
                      </div>

                      {/* Breakdown Reservasi Dompet (Many-to-Many) */}
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Dompet Penampung ({progress.reservations.length})
                        </span>
                        {progress.reservations.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Belum ada dompet penampung yang dialokasikan.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {progress.reservations.map((res) => {
                              const wallet = store.wallets.find((w) => w.id === res.wallet_id);
                              return (
                                <div
                                  key={res.id}
                                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <WalletIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span className="font-medium text-foreground truncate">{wallet?.name || "Wallet"}</span>
                                  </div>
                                  <span className="font-mono text-muted-foreground shrink-0 pl-2">
                                    Rp {res.reserved_amount.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        <div className="flex items-center justify-between sm:justify-start gap-1 w-full sm:w-auto">
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditGoal(goal)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                              title="Edit Goal"
                            >
                              <PencilSimpleIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => store.deleteGoal(goal.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              title="Hapus Goal"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>

                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenGoalEncroachmentHistory(goal)}
                            className="text-[11px] gap-1 h-8 px-2.5 shrink-0"
                          >
                            <ScalesIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Log Encroachment</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Modals */}
      <BudgetFormDialog
        open={isBudgetFormOpen}
        onOpenChange={setIsBudgetFormOpen}
        budgetToEdit={budgetToEdit}
      />

      <GoalFormDialog
        open={isGoalFormOpen}
        onOpenChange={setIsGoalFormOpen}
        goalToEdit={goalToEdit}
      />

      <EncroachmentHistoryDialog
        open={isEncroachmentHistoryOpen}
        onOpenChange={setIsEncroachmentHistoryOpen}
        targetBudget={historyTargetBudget}
        targetGoal={historyTargetGoal}
      />
    </div>
  );
}
