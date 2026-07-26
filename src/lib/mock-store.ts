import { useState, useEffect } from "react";
import { toast } from "sonner";
import type {
  User,
  UserRole,
  Household,
  HouseholdMember,
  Wallet,
  WalletType,
  WalletAccess,
  WalletReconciliation,
  Category,
  CategoryType,
  Transaction,
  Transfer,
  Debt,
  DebtType,
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
  { id: "cat-1", household_id: "household-1", name: "Gaji & Bonus", type: "income", is_system: true, is_active: true, icon: "Money" },
  { id: "cat-2", household_id: "household-1", name: "Side Hustle", type: "income", is_system: false, is_active: true, icon: "Briefcase" },
  { id: "cat-3", household_id: "household-1", name: "Makanan & Resto", type: "expense", is_system: true, is_active: true, icon: "ForkKnife" },
  { id: "cat-4", household_id: "household-1", name: "Tagihan & Utilitas", type: "expense", is_system: true, is_active: true, icon: "Receipt" },
  { id: "cat-5", household_id: "household-1", name: "Belanja Bulanan", type: "expense", is_system: false, is_active: true, icon: "ShoppingCart" },
  { id: "cat-6", household_id: "household-1", name: "Transportasi & Bensin", type: "expense", is_system: true, is_active: true, icon: "Car" },
  { id: "cat-7", household_id: "household-1", name: "Hiburan", type: "expense", is_system: false, is_active: true, icon: "Film" },
  { id: "cat-8", household_id: "household-1", name: "Kesehatan", type: "both", is_system: false, is_active: true, icon: "FirstAid" },
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
    created_by_user_id: "user-1",
    assigned_to_user_id: "user-1",
    assigned_user_ids: ["user-1", "user-2"],
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
    created_by_user_id: "user-1",
    assigned_to_user_id: "user-1",
    assigned_user_ids: ["user-1"],
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

  hasWalletTrackRecord(walletId: string): { hasRecord: boolean; details: string[] } {
    const details: string[] = [];

    const txCount = this.transactions.filter((t) => t.wallet_id === walletId).length;
    if (txCount > 0) details.push(`${txCount} Transaksi`);

    const transferCount = this.transfers.filter(
      (tr) => tr.from_wallet_id === walletId || tr.to_wallet_id === walletId
    ).length;
    if (transferCount > 0) details.push(`${transferCount} Transfer`);

    const debtCount = this.debtPayments.filter((dp) => dp.wallet_id === walletId).length;
    if (debtCount > 0) details.push(`${debtCount} Pembayaran Utang/Piutang`);

    const invCount = this.investmentTransactions.filter((itx) => itx.wallet_id === walletId).length;
    if (invCount > 0) details.push(`${invCount} Transaksi Investasi`);

    const recCount = this.reconciliations.filter((r) => r.wallet_id === walletId).length;
    if (recCount > 0) details.push(`${recCount} Rekonsiliasi Saldo`);

    return {
      hasRecord: details.length > 0,
      details,
    };
  }

  addWallet(data: {
    name: string;
    type: WalletType;
    currency?: string;
    initialBalance: number;
    ownerType: "user" | "household";
    ownerUserId?: string;
  }) {
    if (this.activeRole !== "admin") {
      toast.error("Hanya Admin yang dapat membuat dompet baru!");
      return false;
    }

    const newId = `w-${Date.now()}`;
    const activeUser = this.getActiveUser();
    const ownerUserId = data.ownerType === "user" ? (data.ownerUserId || activeUser.id) : undefined;
    const ownerHouseholdId = data.ownerType === "household" ? "household-1" : undefined;

    const newWallet: Wallet = {
      id: newId,
      name: data.name,
      type: data.type,
      currency: data.currency || "IDR",
      balance: data.initialBalance || 0,
      owner_user_id: ownerUserId,
      owner_household_id: ownerHouseholdId,
    };

    this.wallets = [...this.wallets, newWallet];

    // Jika dompet Kantong Bersama, otomatis beri akses ke semua member
    if (data.ownerType === "household") {
      this.users.forEach((u) => {
        this.walletAccess.push({
          wallet_id: newId,
          user_id: u.id,
          assigned_by: activeUser.id,
        });
      });
    }

    // Catat Saldo Awal sebagai transaksi pemasukan sistem jika > 0
    if (data.initialBalance > 0) {
      const systemCategory = this.categories.find((c) => c.name.includes("Gaji") || c.is_system) || this.categories[0];
      const initTx: Transaction = {
        id: `tx-${Date.now()}`,
        wallet_id: newId,
        category_id: systemCategory?.id || "cat-1",
        owner_id: ownerUserId || activeUser.id,
        recorded_by: activeUser.id,
        type: "income",
        amount: data.initialBalance,
        date: new Date().toISOString().split("T")[0],
        note: `Saldo Awal ${data.name}`,
        status: "active",
      };
      this.transactions = [initTx, ...this.transactions];
    }

    this.logAudit(
      "CREATE_WALLET",
      "WALLETS",
      newId,
      `Membuat dompet baru: ${data.name} (${data.type}) dengan saldo awal Rp ${(data.initialBalance || 0).toLocaleString("id-ID")}`
    );
    toast.success(`Dompet "${data.name}" berhasil dibuat!`);
    emitChange();
    return true;
  }

  updateWallet(
    walletId: string,
    data: {
      name: string;
      type: WalletType;
      ownerType?: "user" | "household";
      ownerUserId?: string;
    }
  ) {
    const wallet = this.wallets.find((w) => w.id === walletId);
    if (!wallet) {
      toast.error("Dompet tidak ditemukan!");
      return false;
    }

    const activeUser = this.getActiveUser();
    // Member hanya boleh mengedit dompet miliknya sendiri
    if (this.activeRole !== "admin" && wallet.owner_user_id !== activeUser.id) {
      toast.error("Member hanya dapat mengubah dompet miliknya sendiri!");
      return false;
    }

    const beforeData = { ...wallet };

    let ownerUserId = wallet.owner_user_id;
    let ownerHouseholdId = wallet.owner_household_id;

    if (this.activeRole === "admin" && data.ownerType) {
      ownerUserId = data.ownerType === "user" ? (data.ownerUserId || activeUser.id) : undefined;
      ownerHouseholdId = data.ownerType === "household" ? "household-1" : undefined;
    }

    this.wallets = this.wallets.map((w) => {
      if (w.id === walletId) {
        return {
          ...w,
          name: data.name,
          type: data.type,
          owner_user_id: ownerUserId,
          owner_household_id: ownerHouseholdId,
        };
      }
      return w;
    });

    this.logAudit(
      "UPDATE_WALLET",
      "WALLETS",
      walletId,
      `Mengubah informasi dompet "${beforeData.name}" menjadi "${data.name}"`,
      beforeData,
      { name: data.name, type: data.type }
    );
    toast.success(`Dompet "${data.name}" berhasil diperbarui!`);
    emitChange();
    return true;
  }

  deleteWallet(walletId: string) {
    const wallet = this.wallets.find((w) => w.id === walletId);
    if (!wallet) {
      toast.error("Dompet tidak ditemukan!");
      return false;
    }

    if (this.activeRole !== "admin") {
      toast.error("Hanya Admin yang dapat menghapus dompet!");
      return false;
    }

    const trackCheck = this.hasWalletTrackRecord(walletId);
    if (trackCheck.hasRecord) {
      toast.error("⚠️ TIDAK DAPAT MENGHAPUS DOMPET!", {
        description: `Dompet "${wallet.name}" memiliki riwayat: ${trackCheck.details.join(", ")}.`,
        duration: 5000,
      });
      return false;
    }

    this.wallets = this.wallets.filter((w) => w.id !== walletId);
    this.walletAccess = this.walletAccess.filter((wa) => wa.wallet_id !== walletId);

    this.logAudit(
      "DELETE_WALLET",
      "WALLETS",
      walletId,
      `Menghapus dompet "${wallet.name}"`
    );
    toast.success(`Dompet "${wallet.name}" berhasil dihapus!`);
    emitChange();
    return true;
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

  hasDebtTrackRecord(debtId: string): boolean {
    return this.debtPayments.some((p) => p.debt_id === debtId && p.status === "active");
  }

  addDebt(data: {
    type: DebtType;
    counterparty: string;
    principal: number;
    assigned_to_user_id?: string;
    assigned_user_ids?: string[];
    use_portion?: boolean;
    portion_admin?: number;
    portion_member?: number;
    due_date: string;
    note?: string;
  }) {
    if (!data.counterparty.trim()) {
      toast.error("Nama Pihak Kedua (Counterparty) tidak boleh kosong!");
      return false;
    }
    if (data.principal <= 0) {
      toast.error("Nominal pokok harus lebih besar dari 0!");
      return false;
    }

    const activeUserId = this.getActiveUser().id;
    const defaultAssigned = data.assigned_user_ids && data.assigned_user_ids.length > 0
      ? data.assigned_user_ids
      : [activeUserId];

    const newDebt: Debt = {
      id: `debt-${Date.now()}`,
      owner_household_id: "household-1",
      created_by_user_id: activeUserId,
      assigned_to_user_id: data.assigned_to_user_id || activeUserId,
      assigned_user_ids: Array.from(new Set([activeUserId, ...defaultAssigned])),
      type: data.type,
      counterparty: data.counterparty.trim(),
      principal: data.principal,
      use_portion: data.use_portion ?? false,
      portion_admin: data.use_portion ? (data.portion_admin ?? data.principal / 2) : undefined,
      portion_member: data.use_portion ? (data.portion_member ?? data.principal / 2) : undefined,
      due_date: data.due_date,
      status: "belum_lunas",
      note: data.note?.trim(),
    };

    this.debts = [newDebt, ...this.debts];
    this.logAudit("CREATE_DEBT", "DEBTS", newDebt.id, `Menambahkan ${data.type} baru: ${data.counterparty} sebesar Rp ${data.principal.toLocaleString("id-ID")}`);
    toast.success(`Catatan ${data.type} "${data.counterparty}" berhasil dibuat!`);
    emitChange();
    return true;
  }

  updateDebt(
    id: string,
    data: {
      type: DebtType;
      counterparty: string;
      principal: number;
      assigned_to_user_id?: string;
      assigned_user_ids?: string[];
      use_portion?: boolean;
      portion_admin?: number;
      portion_member?: number;
      due_date: string;
      note?: string;
    }
  ) {
    const existing = this.debts.find((d) => d.id === id);
    if (!existing) {
      toast.error("Data utang/piutang tidak ditemukan!");
      return false;
    }

    if (!data.counterparty.trim()) {
      toast.error("Nama Pihak Kedua (Counterparty) tidak boleh kosong!");
      return false;
    }
    if (data.principal <= 0) {
      toast.error("Nominal pokok harus lebih besar dari 0!");
      return false;
    }

    const paidTotal = this.debtPayments
      .filter((p) => p.debt_id === id && p.status === "active")
      .reduce((sum, p) => sum + p.amount, 0);

    let nextStatus = existing.status;
    if (paidTotal >= data.principal) {
      nextStatus = "lunas";
    } else if (paidTotal > 0) {
      nextStatus = "cicilan";
    } else {
      nextStatus = "belum_lunas";
    }

    const creatorId = existing.created_by_user_id || this.getActiveUser().id;
    const updatedAssigned = data.assigned_user_ids && data.assigned_user_ids.length > 0
      ? data.assigned_user_ids
      : (existing.assigned_user_ids || [creatorId]);

    this.debts = this.debts.map((d) => {
      if (d.id === id) {
        return {
          ...d,
          type: data.type,
          counterparty: data.counterparty.trim(),
          principal: data.principal,
          assigned_to_user_id: data.assigned_to_user_id || creatorId,
          assigned_user_ids: Array.from(new Set([creatorId, ...updatedAssigned])),
          use_portion: data.use_portion ?? false,
          portion_admin: data.use_portion ? (data.portion_admin ?? data.principal / 2) : undefined,
          portion_member: data.use_portion ? (data.portion_member ?? data.principal / 2) : undefined,
          due_date: data.due_date,
          status: nextStatus,
          note: data.note?.trim(),
        };
      }
      return d;
    });

    this.logAudit("UPDATE_DEBT", "DEBTS", id, `Memperbarui ${data.type}: ${data.counterparty} sebesar Rp ${data.principal.toLocaleString("id-ID")}`);
    toast.success(`Catatan ${data.type} "${data.counterparty}" berhasil diperbarui!`);
    emitChange();
    return true;
  }

  deleteDebt(id: string) {
    const debt = this.debts.find((d) => d.id === id);
    if (!debt) {
      toast.error("Catatan utang/piutang tidak ditemukan!");
      return false;
    }

    if (this.hasDebtTrackRecord(id)) {
      toast.error("⚠️ DATA TIDAK DAPAT DIHAPUS!", {
        description: `Utang/Piutang "${debt.counterparty}" sudah memiliki riwayat pembayaran/cicilan. Hapus pembayaran terkait lebih dulu atau ubah catatannya.`,
      });
      return false;
    }

    this.debts = this.debts.filter((d) => d.id !== id);
    this.logAudit("DELETE_DEBT", "DEBTS", id, `Menghapus ${debt.type}: "${debt.counterparty}"`);
    toast.success(`Catatan ${debt.type} "${debt.counterparty}" berhasil dihapus!`);
    emitChange();
    return true;
  }

  deleteDebtPayment(paymentId: string) {
    const payment = this.debtPayments.find((p) => p.id === paymentId);
    if (!payment) return false;

    const debt = this.debts.find((d) => d.id === payment.debt_id);
    if (!debt) return false;

    // Revert wallet balance
    const wallet = this.wallets.find((w) => w.id === payment.wallet_id);
    if (wallet) {
      const revertDiff = debt.type === "utang" ? payment.amount : -payment.amount;
      this.wallets = this.wallets.map((w) =>
        w.id === payment.wallet_id ? { ...w, balance: w.balance + revertDiff } : w
      );
    }

    this.debtPayments = this.debtPayments.filter((p) => p.id !== paymentId);

    // Recalculate debt status
    const remainingPayments = this.debtPayments
      .filter((p) => p.debt_id === debt.id && p.status === "active")
      .reduce((sum, p) => sum + p.amount, 0);

    const newStatus =
      remainingPayments >= debt.principal
        ? "lunas"
        : remainingPayments > 0
        ? "cicilan"
        : "belum_lunas";

    this.debts = this.debts.map((d) =>
      d.id === debt.id ? { ...d, status: newStatus } : d
    );

    this.logAudit("DELETE_DEBT_PAYMENT", "DEBT_PAYMENTS", paymentId, `Membatalkan pembayaran Rp ${payment.amount.toLocaleString("id-ID")} untuk ${debt.counterparty}`);
    toast.info("Pembayaran berhasil dibatalkan dan saldo wallet dikembalikan.");
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

  updateMember(userId: string, data: { name: string; email: string; role: UserRole; canEditOthers: boolean }) {
    this.users = this.users.map((u) =>
      u.id === userId ? { ...u, name: data.name, email: data.email } : u
    );

    this.members = this.members.map((m) =>
      m.user_id === userId
        ? { ...m, role: data.role, can_edit_others_transactions: data.canEditOthers }
        : m
    );

    this.logAudit(
      "UPDATE_MEMBER",
      "HOUSEHOLD_MEMBERS",
      userId,
      `Memperbarui data member ${data.name} (${data.email}), Role: ${data.role}`
    );
    toast.success(`Data member ${data.name} berhasil diperbarui!`);
    emitChange();
  }

  deleteMember(userId: string) {
    const activeUser = this.getActiveUser();
    if (activeUser.id === userId) {
      toast.error("Anda tidak dapat menghapus akun Anda sendiri.");
      return false;
    }

    const targetUser = this.users.find((u) => u.id === userId);
    const targetName = targetUser ? targetUser.name : userId;

    this.members = this.members.filter((m) => m.user_id !== userId);
    this.walletAccess = this.walletAccess.filter((wa) => wa.user_id !== userId);

    this.logAudit(
      "DELETE_MEMBER",
      "HOUSEHOLD_MEMBERS",
      userId,
      `Menghapus member ${targetName} dari Household dan mencabut seluruh akses dompet.`
    );
    toast.success(`Member ${targetName} telah dihapus dari Household.`);
    emitChange();
    return true;
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

  // Category CRUD Operations
  hasCategoryTrackRecord(categoryId: string): { hasRecord: boolean; details: string[] } {
    const details: string[] = [];

    const txCount = this.transactions.filter((t) => t.category_id === categoryId).length;
    if (txCount > 0) details.push(`${txCount} Transaksi`);

    const budgetCount = this.budgets.filter((b) => b.category_id === categoryId).length;
    if (budgetCount > 0) details.push(`${budgetCount} Anggaran / Budget`);

    return {
      hasRecord: details.length > 0,
      details,
    };
  }

  addCategory(data: { name: string; type: CategoryType; icon?: string }) {
    if (this.activeRole !== "admin") {
      toast.error("Hanya Admin yang dapat membuat kategori!");
      return false;
    }

    if (!data.name.trim()) {
      toast.error("Nama kategori tidak boleh kosong!");
      return false;
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      household_id: "household-1",
      name: data.name.trim(),
      type: data.type,
      is_system: false,
      is_active: true,
      icon: data.icon || "Tag",
    };

    this.categories = [...this.categories, newCategory];
    this.logAudit("CREATE_CATEGORY", "CATEGORIES", newCategory.id, `Menambahkan kategori "${newCategory.name}" (${data.type})`);
    toast.success(`Kategori "${newCategory.name}" berhasil dibuat!`);
    emitChange();
    return true;
  }

  updateCategory(id: string, data: { name: string; type: CategoryType; icon?: string; is_active?: boolean }) {
    if (this.activeRole !== "admin") {
      toast.error("Hanya Admin yang dapat mengedit kategori!");
      return false;
    }

    const category = this.categories.find((c) => c.id === id);
    if (!category) {
      toast.error("Kategori tidak ditemukan!");
      return false;
    }

    if (!data.name.trim()) {
      toast.error("Nama kategori tidak boleh kosong!");
      return false;
    }

    const updatedCategories = this.categories.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          name: data.name.trim(),
          type: data.type,
          icon: data.icon || c.icon,
          is_active: c.is_system ? true : (data.is_active !== undefined ? data.is_active : c.is_active),
        };
      }
      return c;
    });

    this.categories = updatedCategories;
    this.logAudit("UPDATE_CATEGORY", "CATEGORIES", id, `Mengedit kategori "${data.name}"`);
    toast.success(`Kategori "${data.name}" berhasil diperbarui!`);
    emitChange();
    return true;
  }

  toggleCategoryStatus(id: string) {
    if (this.activeRole !== "admin") {
      toast.error("Hanya Admin yang dapat mengubah status kategori!");
      return false;
    }

    const category = this.categories.find((c) => c.id === id);
    if (!category) return false;

    if (category.is_system) {
      toast.error("Kategori bawaan sistem tidak dapat dinonaktifkan!");
      return false;
    }

    const nextStatus = !category.is_active;
    this.categories = this.categories.map((c) =>
      c.id === id ? { ...c, is_active: nextStatus } : c
    );

    this.logAudit(
      "TOGGLE_CATEGORY_STATUS",
      "CATEGORIES",
      id,
      `Mengubah status kategori "${category.name}" menjadi ${nextStatus ? "Aktif" : "Non-aktif"}`
    );
    toast.info(`Kategori "${category.name}" sekarang ${nextStatus ? "Aktif" : "Non-aktif"}`);
    emitChange();
    return true;
  }

  deleteCategory(id: string) {
    if (this.activeRole !== "admin") {
      toast.error("Hanya Admin yang dapat menghapus kategori!");
      return false;
    }

    const category = this.categories.find((c) => c.id === id);
    if (!category) {
      toast.error("Kategori tidak ditemukan!");
      return false;
    }

    if (category.is_system) {
      toast.error("⚠️ KATEGORI SISTEM TIDAK BISA DIHAPUS!", {
        description: `Kategori "${category.name}" merupakan kategori bawaan sistem dan tidak dapat dihilangkan.`,
      });
      return false;
    }

    const recordCheck = this.hasCategoryTrackRecord(id);
    if (recordCheck.hasRecord) {
      toast.error("⚠️ KATEGORI TIDAK DAPAT DIHAPUS!", {
        description: `Kategori "${category.name}" masih terikat dengan ${recordCheck.details.join(", ")}. Hapus data terkait lebih dulu atau nonaktifkan kategori.`,
      });
      return false;
    }

    this.categories = this.categories.filter((c) => c.id !== id);
    this.logAudit("DELETE_CATEGORY", "CATEGORIES", id, `Menghapus kategori "${category.name}"`);
    toast.success(`Kategori "${category.name}" berhasil dihapus!`);
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
