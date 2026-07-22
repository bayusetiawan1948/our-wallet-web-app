import { useState, useEffect } from "react";
import { toast } from "sonner";
import type {
  User,
  UserRole,
  Household,
  HouseholdMember,
  Wallet,
  WalletAccess,
  WalletReconciliation,
  Category,
  Transaction,
  Transfer,
  Debt,
  DebtPayment,
  Investment,
  InvestmentTransaction,
  InvestmentValuation,
  Budget,
  AuditLog,
} from "@/types";

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { id: "user-1", name: "Bayu", email: "bayu@family.com", base_currency: "IDR" },
  { id: "user-2", name: "Annisa", email: "annisa@family.com", base_currency: "IDR" },
];

const INITIAL_HOUSEHOLD: Household = {
  id: "household-1",
  name: "Keluarga Bayu & Annisa",
};

const INITIAL_MEMBERS: HouseholdMember[] = [
  { household_id: "household-1", user_id: "user-1", role: "admin", can_edit_others_transactions: true },
  { household_id: "household-1", user_id: "user-2", role: "member", can_edit_others_transactions: false },
];

const INITIAL_WALLETS: Wallet[] = [
  { id: "w-1", owner_user_id: "user-1", name: "BCA Bayu", type: "bank", currency: "IDR", balance: 25000000 },
  { id: "w-2", owner_user_id: "user-1", name: "GoPay Bayu", type: "ewallet", currency: "IDR", balance: 2500000 },
  { id: "w-3", owner_user_id: "user-2", name: "Mandiri Annisa", type: "bank", currency: "IDR", balance: 8000000 },
  { id: "w-4", owner_household_id: "household-1", name: "Kantong Jago Bersama", type: "bank", currency: "IDR", balance: 15000000 },
];

const INITIAL_WALLET_ACCESS: WalletAccess[] = [
  { wallet_id: "w-3", user_id: "user-2", assigned_by: "user-1" },
  { wallet_id: "w-4", user_id: "user-2", assigned_by: "user-1" },
  { wallet_id: "w-4", user_id: "user-1", assigned_by: "user-1" },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: "cat-1", household_id: "household-1", name: "Gaji & Bonus", is_system: true, is_hidden: false, icon: "Money" },
  { id: "cat-2", household_id: "household-1", name: "Side Hustle", is_system: false, is_hidden: false, icon: "Briefcase" },
  { id: "cat-3", household_id: "household-1", name: "Makanan & Resto", is_system: true, is_hidden: false, icon: "ForkKnife" },
  { id: "cat-4", household_id: "household-1", name: "Tagihan & Utilitas", is_system: true, is_hidden: false, icon: "Receipt" },
  { id: "cat-5", household_id: "household-1", name: "Belanja Bulanan", is_system: false, is_hidden: false, icon: "ShoppingCart" },
  { id: "cat-6", household_id: "household-1", name: "Transportasi & Bensin", is_system: true, is_hidden: false, icon: "Car" },
  { id: "cat-7", household_id: "household-1", name: "Hiburan", is_system: false, is_hidden: false, icon: "Film" },
  { id: "cat-8", household_id: "household-1", name: "Kesehatan", is_system: false, is_hidden: false, icon: "FirstAid" },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    wallet_id: "w-1",
    category_id: "cat-1",
    owner_id: "user-1",
    recorded_by: "user-1",
    type: "income",
    amount: 15000000,
    date: "2026-07-01",
    note: "Gaji Bulanan Bayu",
    status: "active",
  },
  {
    id: "tx-2",
    wallet_id: "w-3",
    category_id: "cat-1",
    owner_id: "user-2",
    recorded_by: "user-2",
    type: "income",
    amount: 8000000,
    date: "2026-07-02",
    note: "Gaji Bulanan Annisa",
    status: "active",
  },
  {
    id: "tx-3",
    wallet_id: "w-3",
    category_id: "cat-3",
    owner_id: "user-2",
    recorded_by: "user-2",
    type: "expense",
    amount: 750000,
    date: "2026-07-10",
    note: "Makan Malam Keluarga",
    status: "active",
  },
  {
    id: "tx-4",
    wallet_id: "w-1",
    category_id: "cat-5",
    owner_id: "user-1",
    recorded_by: "user-1",
    type: "expense",
    amount: 1200000,
    date: "2026-07-15",
    note: "Belanja Supemarket",
    status: "active",
  },
];

const INITIAL_TRANSFERS: Transfer[] = [
  {
    id: "tr-1",
    from_wallet_id: "w-1",
    to_wallet_id: "w-4",
    amount: 5000000,
    fee: 0,
    date: "2026-07-05",
    note: "Alokasi Kantong Bersama",
    status: "active",
  },
];

const INITIAL_DEBTS: Debt[] = [
  {
    id: "debt-1",
    owner_household_id: "household-1",
    type: "utang",
    counterparty: "Bank BCA (KPR / Motor)",
    principal: 12000000,
    portion_admin: 6000000,
    portion_member: 6000000,
    due_date: "2026-12-31",
    status: "cicilan",
    note: "Cicilan Kendaraan Keluarga",
  },
  {
    id: "debt-2",
    owner_user_id: "user-1",
    type: "piutang",
    counterparty: "Rekan Kerja (Budi)",
    principal: 3000000,
    portion_admin: 3000000,
    portion_member: 0,
    due_date: "2026-09-30",
    status: "belum_lunas",
    note: "Pinjaman Teman Kantor",
  },
];

const INITIAL_DEBT_PAYMENTS: DebtPayment[] = [
  {
    id: "dp-1",
    debt_id: "debt-1",
    wallet_id: "w-4",
    amount: 2000000,
    date: "2026-07-10",
    status: "active",
    recorded_by: "user-1",
  },
];

const INITIAL_INVESTMENTS: Investment[] = [
  { id: "inv-1", owner_household_id: "household-1", asset_type: "emas", asset_name: "Emas Logam Mulia Antam", unit: "gram" },
  { id: "inv-2", owner_user_id: "user-1", asset_type: "crypto", asset_name: "Bitcoin (BTC)", unit: "BTC" },
  { id: "inv-3", owner_household_id: "household-1", asset_type: "saham", asset_name: "Bank Central Asia (BBCA)", unit: "lot" },
];

const INITIAL_INVESTMENT_TRANSACTIONS: InvestmentTransaction[] = [
  { id: "itx-1", investment_id: "inv-1", wallet_id: "w-1", type: "buy", quantity: 10, price: 1300000, date: "2026-06-01", status: "active" },
  { id: "itx-2", investment_id: "inv-2", wallet_id: "w-1", type: "buy", quantity: 0.015, price: 1000000000, date: "2026-06-15", status: "active" },
  { id: "itx-3", investment_id: "inv-3", wallet_id: "w-4", type: "buy", quantity: 20, price: 1000000, date: "2026-07-01", status: "active" },
];

const INITIAL_VALUATIONS: InvestmentValuation[] = [
  { id: "val-1", investment_id: "inv-1", price_per_unit: 1350000, date: "2026-07-20", source: "manual" },
  { id: "val-2", investment_id: "inv-2", price_per_unit: 1050000000, date: "2026-07-20", source: "api" },
  { id: "val-3", investment_id: "inv-3", price_per_unit: 1020000, date: "2026-07-20", source: "manual" },
];

const INITIAL_BUDGETS: Budget[] = [
  { id: "b-1", category_id: "cat-3", owner_household_id: "household-1", name: "Budget Kuliner & Resto", target_amount: 3500000, period: "monthly", start_date: "2026-07-01" },
  { id: "b-2", category_id: "cat-4", owner_household_id: "household-1", name: "Budget Tagihan Listrik & Air", target_amount: 2000000, period: "monthly", start_date: "2026-07-01" },
  { id: "b-3", category_id: "cat-5", owner_household_id: "household-1", name: "Budget Belanja Bulanan Supermarket", target_amount: 4000000, period: "monthly", start_date: "2026-07-01" },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    actor_id: "user-1",
    actor_name: "Bayu (Admin)",
    entity_type: "HOUSEHOLD_MEMBERS",
    entity_id: "user-2",
    action: "ADD_MEMBER",
    details: "Menambahkan Annisa sebagai Member pasangan ke Household",
    created_at: "2026-07-01 09:00:00",
  },
  {
    id: "log-2",
    actor_id: "user-1",
    actor_name: "Bayu (Admin)",
    entity_type: "WALLET_ACCESS",
    entity_id: "w-4",
    action: "ASSIGN_WALLET_ACCESS",
    details: "Memberikan akses Kantong Jago Bersama kepada Annisa",
    created_at: "2026-07-01 09:05:00",
  },
];

// Reactive Store Implementation with Listeners
type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

class Store {
  activeRole: UserRole = "admin";
  users: User[] = INITIAL_USERS;
  household: Household = INITIAL_HOUSEHOLD;
  members: HouseholdMember[] = INITIAL_MEMBERS;
  wallets: Wallet[] = INITIAL_WALLETS;
  walletAccess: WalletAccess[] = INITIAL_WALLET_ACCESS;
  reconciliations: WalletReconciliation[] = [];
  categories: Category[] = INITIAL_CATEGORIES;
  transactions: Transaction[] = INITIAL_TRANSACTIONS;
  transfers: Transfer[] = INITIAL_TRANSFERS;
  debts: Debt[] = INITIAL_DEBTS;
  debtPayments: DebtPayment[] = INITIAL_DEBT_PAYMENTS;
  investments: Investment[] = INITIAL_INVESTMENTS;
  investmentTransactions: InvestmentTransaction[] = INITIAL_INVESTMENT_TRANSACTIONS;
  valuations: InvestmentValuation[] = INITIAL_VALUATIONS;
  budgets: Budget[] = INITIAL_BUDGETS;
  auditLogs: AuditLog[] = INITIAL_AUDIT_LOGS;

  getActiveUser(): User {
    return this.activeRole === "admin"
      ? this.users.find((u) => u.id === "user-1")!
      : this.users.find((u) => u.id === "user-2")!;
  }

  setRole(role: UserRole) {
    this.activeRole = role;
    const user = this.getActiveUser();
    toast.info(`Berhasil beralih ke role: ${user.name} (${role === "admin" ? "Admin / Kepala Keluarga" : "Member / Pasangan"})`);
    emitChange();
  }

  getAccessibleWallets(): Wallet[] {
    if (this.activeRole === "admin") {
      return this.wallets;
    }
    const memberId = "user-2";
    const allowedWalletIds = new Set(
      this.walletAccess.filter((wa) => wa.user_id === memberId).map((wa) => wa.wallet_id)
    );
    return this.wallets.filter(
      (w) => w.owner_user_id === memberId || allowedWalletIds.has(w.id)
    );
  }

  logAudit(action: string, entity_type: string, entity_id: string, details: string, before?: Record<string, unknown>, after?: Record<string, unknown>) {
    const activeUser = this.getActiveUser();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      actor_id: activeUser.id,
      actor_name: `${activeUser.name} (${this.activeRole === "admin" ? "Admin" : "Member"})`,
      entity_type,
      entity_id,
      action,
      details,
      before_data: before,
      after_data: after,
      created_at: new Date().toLocaleString("id-ID"),
    };
    this.auditLogs = [newLog, ...this.auditLogs];
  }

  checkBudgetWarning(categoryId: string, addedAmount: number) {
    const category = this.categories.find((c) => c.id === categoryId);
    if (!category) return;

    const budget = this.budgets.find((b) => b.category_id === categoryId);
    if (!budget) return;

    const totalCurrentExpense = this.transactions
      .filter((t) => t.category_id === categoryId && t.type === "expense" && t.status === "active")
      .reduce((sum, t) => sum + t.amount, 0);

    const projectedTotal = totalCurrentExpense + addedAmount;
    if (projectedTotal > budget.target_amount) {
      const overBy = projectedTotal - budget.target_amount;
      toast.warning(`⚠️ PERINGATAN OVERBUDGET!`, {
        description: `Kategori "${category.name}" melebihi budget sebesar Rp ${overBy.toLocaleString("id-ID")}. Target: Rp ${budget.target_amount.toLocaleString("id-ID")}.`,
        duration: 6000,
      });
    }
  }

  addTransaction(txData: Omit<Transaction, "id" | "recorded_by" | "status">) {
    const activeUser = this.getActiveUser();
    const wallet = this.wallets.find((w) => w.id === txData.wallet_id);

    if (!wallet) {
      toast.error("Wallet tidak ditemukan");
      return false;
    }

    if (txData.type === "expense" && wallet.balance < txData.amount) {
      toast.error("⚠️ SALDO TIDAK CUKUP!", {
        description: `Saldo dompet "${wallet.name}" saat ini Rp ${wallet.balance.toLocaleString("id-ID")}, kurang untuk pengeluaran Rp ${txData.amount.toLocaleString("id-ID")}.`,
      });
      return false;
    }

    if (txData.type === "expense") {
      this.checkBudgetWarning(txData.category_id, txData.amount);
    }

    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      recorded_by: activeUser.id,
      status: "active",
    };

    const updatedWallets = this.wallets.map((w) => {
      if (w.id === txData.wallet_id) {
        const balanceDiff = txData.type === "income" ? txData.amount : -txData.amount;
        return { ...w, balance: w.balance + balanceDiff };
      }
      return w;
    });

    this.wallets = updatedWallets;
    this.transactions = [newTx, ...this.transactions];

    this.logAudit("CREATE_TRANSACTION", "TRANSACTIONS", newTx.id, `Mencatat ${txData.type === "income" ? "pemasukan" : "pengeluaran"} Rp ${txData.amount.toLocaleString("id-ID")} di ${wallet.name}`);
    toast.success(`Transaksi berhasil dicatat pada ${wallet.name}`);
    emitChange();
    return true;
  }

  voidTransaction(txId: string) {
    const tx = this.transactions.find((t) => t.id === txId);
    if (!tx || tx.status === "void") return;

    const wallet = this.wallets.find((w) => w.id === tx.wallet_id);
    if (!wallet) return;

    const reverseDiff = tx.type === "income" ? -tx.amount : tx.amount;
    this.wallets = this.wallets.map((w) =>
      w.id === tx.wallet_id ? { ...w, balance: w.balance + reverseDiff } : w
    );

    this.transactions = this.transactions.map((t) =>
      t.id === txId ? { ...t, status: "void" } : t
    );

    this.logAudit("VOID_TRANSACTION", "TRANSACTIONS", txId, `Membatalkan/Void transaksi Rp ${tx.amount.toLocaleString("id-ID")} di ${wallet.name}`);
    toast.info("Transaksi berhasil di-void / dibatalkan");
    emitChange();
  }

  addTransfer(fromWalletId: string, toWalletId: string, amount: number, fee: number, date: string, note?: string) {
    const accessibleWallets = this.getAccessibleWallets();

    const fromWallet = accessibleWallets.find((w) => w.id === fromWalletId);
    const toWallet = this.wallets.find((w) => w.id === toWalletId);

    if (!fromWallet) {
      toast.error("Anda tidak memiliki akses ke wallet sumber!");
      return false;
    }
    if (!toWallet) {
      toast.error("Wallet tujuan tidak ditemukan!");
      return false;
    }

    const totalDeduction = amount + fee;
    if (fromWallet.balance < totalDeduction) {
      toast.error("⚠️ SALDO TIDAK CUKUP!", {
        description: `Saldo dompet "${fromWallet.name}" (Rp ${fromWallet.balance.toLocaleString("id-ID")}) kurang untuk transfer Rp ${amount.toLocaleString("id-ID")} + biaya Rp ${fee.toLocaleString("id-ID")}.`,
      });
      return false;
    }

    const newTransfer: Transfer = {
      id: `tr-${Date.now()}`,
      from_wallet_id: fromWalletId,
      to_wallet_id: toWalletId,
      amount,
      fee,
      date,
      note,
      status: "active",
    };

    this.wallets = this.wallets.map((w) => {
      if (w.id === fromWalletId) return { ...w, balance: w.balance - totalDeduction };
      if (w.id === toWalletId) return { ...w, balance: w.balance + amount };
      return w;
    });

    this.transfers = [newTransfer, ...this.transfers];
    this.logAudit("CREATE_TRANSFER", "TRANSFERS", newTransfer.id, `Transfer Rp ${amount.toLocaleString("id-ID")} dari ${fromWallet.name} ke ${toWallet.name}`);
    toast.success(`Transfer sebesar Rp ${amount.toLocaleString("id-ID")} berhasil!`);
    emitChange();
    return true;
  }

  voidTransfer(trId: string) {
    const tr = this.transfers.find((t) => t.id === trId);
    if (!tr || tr.status === "void") return;

    this.wallets = this.wallets.map((w) => {
      if (w.id === tr.from_wallet_id) return { ...w, balance: w.balance + tr.amount + tr.fee };
      if (w.id === tr.to_wallet_id) return { ...w, balance: w.balance - tr.amount };
      return w;
    });

    this.transfers = this.transfers.map((t) =>
      t.id === trId ? { ...t, status: "void" } : t
    );

    this.logAudit("VOID_TRANSFER", "TRANSFERS", trId, `Void transfer Rp ${tr.amount.toLocaleString("id-ID")}`);
    toast.info("Transfer berhasil dibatalkan / void");
    emitChange();
  }

  addDebtPayment(debtId: string, walletId: string, amount: number, date: string) {
    const activeUser = this.getActiveUser();
    const accessibleWallets = this.getAccessibleWallets();
    const wallet = accessibleWallets.find((w) => w.id === walletId);
    const debt = this.debts.find((d) => d.id === debtId);

    if (!debt) return false;
    if (!wallet) {
      toast.error("Member hanya boleh membayar dari wallet yang di-assign padanya!");
      return false;
    }

    if (debt.type === "utang" && wallet.balance < amount) {
      toast.error("⚠️ SALDO TIDAK CUKUP!", {
        description: `Saldo dompet "${wallet.name}" tidak mencukupi untuk pembayaran utang Rp ${amount.toLocaleString("id-ID")}.`,
      });
      return false;
    }

    const newPayment: DebtPayment = {
      id: `dp-${Date.now()}`,
      debt_id: debtId,
      wallet_id: walletId,
      amount,
      date,
      status: "active",
      recorded_by: activeUser.id,
    };

    const balanceDiff = debt.type === "utang" ? -amount : amount;
    this.wallets = this.wallets.map((w) =>
      w.id === walletId ? { ...w, balance: w.balance + balanceDiff } : w
    );

    const existingPayments = this.debtPayments
      .filter((p) => p.debt_id === debtId && p.status === "active")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPaid = existingPayments + amount;
    const newStatus = totalPaid >= debt.principal ? "lunas" : "cicilan";

    this.debts = this.debts.map((d) =>
      d.id === debtId ? { ...d, status: newStatus } : d
    );

    this.debtPayments = [newPayment, ...this.debtPayments];
    this.logAudit("CREATE_DEBT_PAYMENT", "DEBT_PAYMENTS", newPayment.id, `Pembayaran ${debt.type} Rp ${amount.toLocaleString("id-ID")} via ${wallet.name}`);
    toast.success(`Pembayaran ${debt.type} berhasil dicatat!`);
    emitChange();
    return true;
  }

  reconcileWallet(walletId: string, actualBalance: number, notes?: string) {
    const wallet = this.wallets.find((w) => w.id === walletId);
    if (!wallet) return false;

    const recordedBalance = wallet.balance;
    const diff = actualBalance - recordedBalance;

    const reconciliation: WalletReconciliation = {
      id: `rec-${Date.now()}`,
      wallet_id: walletId,
      recorded_balance: recordedBalance,
      actual_balance: actualBalance,
      date: new Date().toISOString().split("T")[0],
      notes,
    };

    this.wallets = this.wallets.map((w) =>
      w.id === walletId ? { ...w, balance: actualBalance } : w
    );

    this.reconciliations = [reconciliation, ...this.reconciliations];
    this.logAudit("RECONCILE_WALLET", "WALLETS", walletId, `Rekonsiliasi saldo ${wallet.name} dari Rp ${recordedBalance.toLocaleString("id-ID")} ke Rp ${actualBalance.toLocaleString("id-ID")} (Selisih: Rp ${diff.toLocaleString("id-ID")})`);
    toast.success(`Rekonsiliasi ${wallet.name} selesai! Saldo baru: Rp ${actualBalance.toLocaleString("id-ID")}`);
    emitChange();
    return true;
  }

  addMember(name: string, email: string, canEditOthers: boolean) {
    const newId = `user-${Date.now()}`;
    const newUser: User = { id: newId, name, email, base_currency: "IDR" };
    const newMember: HouseholdMember = {
      household_id: "household-1",
      user_id: newId,
      role: "member",
      can_edit_others_transactions: canEditOthers,
    };

    this.users = [...this.users, newUser];
    this.members = [...this.members, newMember];
    this.logAudit("ADD_MEMBER", "HOUSEHOLD_MEMBERS", newId, `Menambahkan member baru: ${name} (${email})`);
    toast.success(`Member ${name} berhasil ditambahkan!`);
    emitChange();
  }

  toggleWalletAccess(walletId: string, userId: string) {
    const exists = this.walletAccess.some(
      (wa) => wa.wallet_id === walletId && wa.user_id === userId
    );

    if (exists) {
      this.walletAccess = this.walletAccess.filter(
        (wa) => !(wa.wallet_id === walletId && wa.user_id === userId)
      );
      this.logAudit("REVOKE_WALLET_ACCESS", "WALLET_ACCESS", walletId, `Mencabut akses wallet ${walletId} dari user ${userId}`);
      toast.info("Akses wallet dicabut.");
    } else {
      const newAccess: WalletAccess = {
        wallet_id: walletId,
        user_id: userId,
        assigned_by: this.getActiveUser().id,
      };
      this.walletAccess = [...this.walletAccess, newAccess];
      this.logAudit("GRANT_WALLET_ACCESS", "WALLET_ACCESS", walletId, `Memberikan akses wallet ${walletId} kepada user ${userId}`);
      toast.success("Akses wallet diberikan!");
    }
    emitChange();
  }

  addBudget(budget: Budget) {
    this.budgets = [...this.budgets, budget];
    this.logAudit("CREATE_BUDGET", "BUDGETS", budget.id, `Membuat budget ${budget.name} target Rp ${budget.target_amount.toLocaleString("id-ID")}`);
    toast.success(`Budget ${budget.name} berhasil dibuat!`);
    emitChange();
  }

  updateInvestmentValuation(investmentId: string, newPrice: number) {
    const inv = this.investments.find((i) => i.id === investmentId);
    if (!inv) return;

    const newValuation: InvestmentValuation = {
      id: `val-${Date.now()}`,
      investment_id: investmentId,
      price_per_unit: newPrice,
      date: new Date().toISOString().split("T")[0],
      source: "manual",
    };

    this.valuations = [newValuation, ...this.valuations.filter((v) => v.investment_id !== investmentId)];
    this.logAudit("UPDATE_VALUATION", "INVESTMENT_VALUATIONS", investmentId, `Update harga pasar ${inv.asset_name} ke Rp ${newPrice.toLocaleString("id-ID")} per ${inv.unit}`);
    toast.success(`Harga pasar ${inv.asset_name} diperbarui!`);
    emitChange();
  }

  addInvestmentTransaction(investmentId: string, walletId: string, type: "buy" | "sell", quantity: number, price: number, date: string) {
    const wallet = this.getAccessibleWallets().find((w) => w.id === walletId);
    const inv = this.investments.find((i) => i.id === investmentId);

    if (!wallet || !inv) return false;

    const totalPrice = quantity * price;
    if (type === "buy" && wallet.balance < totalPrice) {
      toast.error("⚠️ SALDO TIDAK CUKUP!", {
        description: `Saldo wallet ${wallet.name} (Rp ${wallet.balance.toLocaleString("id-ID")}) kurang untuk beli ${quantity} ${inv.unit} ${inv.asset_name} seharga Rp ${totalPrice.toLocaleString("id-ID")}.`,
      });
      return false;
    }

    const newTx: InvestmentTransaction = {
      id: `itx-${Date.now()}`,
      investment_id: investmentId,
      wallet_id: walletId,
      type,
      quantity,
      price,
      date,
      status: "active",
    };

    const balanceDiff = type === "buy" ? -totalPrice : totalPrice;
    this.wallets = this.wallets.map((w) =>
      w.id === walletId ? { ...w, balance: w.balance + balanceDiff } : w
    );

    this.investmentTransactions = [newTx, ...this.investmentTransactions];
    this.logAudit("CREATE_INVESTMENT_TX", "INVESTMENT_TRANSACTIONS", newTx.id, `${type === "buy" ? "Membeli" : "Menjual"} ${quantity} ${inv.unit} ${inv.asset_name} seharga total Rp ${totalPrice.toLocaleString("id-ID")}`);
    toast.success(`Transaksi investasi ${inv.asset_name} berhasil!`);
    emitChange();
    return true;
  }
}

export const mockStore = new Store();

export function useMockStore() {
  const [, tick] = useState(0);

  useEffect(() => {
    const handleStoreChange = () => tick((t) => t + 1);
    listeners.add(handleStoreChange);
    return () => {
      listeners.delete(handleStoreChange);
    };
  }, []);

  return mockStore;
}
