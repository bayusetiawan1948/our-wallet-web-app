# 👛 Our Wallets — Aplikasi Pencatatan & Manajemen Keuangan Keluarga

**Our Wallets** adalah aplikasi manajemen keuangan keluarga dan pribadi berbasis web modern. Aplikasi ini dirancang untuk memberikan transparansi, presisi visual tinggi, serta kemudahan dalam mengelola alokasi saldo dompet, transaksi harian, investasi, utang/piutang, anggaran (budgeting), dan pembagian peran anggota keluarga (*Household Management*).

---

## 🌟 Fitur Utama

- **📊 Dashboard Analytics**: Visualisasi alokasi dompet, tren arus kas bulanan, breakdown kategori pengeluaran, serta ringkasan kekayaan bersih (*Net Worth*).
- **🏠 Household & Dual-Role Management**:
  - Simulasi **Quick Role Switcher** di header (`Bayu (Admin)` vs `Annisa (Member)`).
  - Isolasi data keluarga & izin mencatat/melihat transaksi sesuai hak akses dompet.
- **💳 Wallet & Asset Management**: Pengelolaan rekening bank, e-wallet, dan uang tunai. Mendukung transfer antar dompet tanpa pembukuan ganda.
- **💸 Transactions & Cashflow**: Pencatatan transaksi masukan & keluaran lengkap dengan tanggal, pembuat (*recorded_by*), dan pemilik uang (*owner_id*).
- **📈 Investments Tracker**: Monitoring portofolio aset (Emas, Crypto, Saham, Reksadana) lengkap dengan estimasi return (PnL) & alokasi aset.
- **🤝 Debts & Receivables (Utang/Piutang)**: Pencatatan utang/piutang dengan pemisahan porsi admin/member & riwayat pelunasan.
- **🎯 Budgets**: Pengaturan batas anggaran per kategori bulanan lengkap dengan indikator & warning overbudget.
- **🌙 Adaptive Dark & Light Mode**: Didukung oleh `next-themes` dan skema warna OKLCH.

---

## 🛠️ Teknologi & Stack

| Layer | Teknologi |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) |
| **Bahasa** | [TypeScript 6](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) (Typography OKLCH & Monospace precision) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) (`radix-mira` / `@base-ui/react`) |
| **Icons** | [Phosphor Icons](https://phosphoricons.com/) (`@phosphor-icons/react`) |
| **Routing** | [React Router v7](https://reactrouter.com/) |
| **Charts** | [Recharts v3](https://recharts.org/) |
| **Notification** | [Sonner](https://sonner.emilkowal.si/) |

---

## 🚀 Panduan Memulai (Getting Started)

### Prasyarat
- Node.js (v18+ direkomendasikan)
- npm / pnpm / yarn

### Instalasi & Menjalankan Aplikasi

1. **Clone repository & masuk ke direktori proyek**:
   ```bash
   git clone <repository-url>
   cd our-wallets
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses melalui `http://localhost:5173`.

---

## 📜 Script yang Tersedia

- `npm run dev` — Menjalankan development server Vite dengan HMR.
- `npm run build` — Melakukan typechecking TypeScript & bundling produksi.
- `npm run preview` — Menjalankan preview dari build produksi.
- `npm run lint` — Memeriksa kualitas kode dengan ESLint.
- `npm run format` — Memformat ulang kode menggunakan Prettier & plugin Tailwind.
- `npm run typecheck` — Memeriksa tipe data TypeScript tanpa melakukan emit file.

---

## 📚 Dokumen Pendukung

- 📐 **[Design Specification (design.md)](file:///d:/code/Typescript/shadcn-preset/our-wallets/design.md)** — Panduan sistem desain, warna OKLCH, dan tipografi monospaced.
- 🗄️ **[Entity Relationship Diagram (ERD.md)](file:///d:/code/Typescript/shadcn-preset/our-wallets/ERD.md)** — Dokumentasi arsitektur data & struktur relasi basis data.
