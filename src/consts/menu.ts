import {
  GaugeIcon, // Dashboard
  ArrowsDownUpIcon, // Transaksi & Transfer
  WalletIcon, // Dompet & Rekonsiliasi
  HandshakeIcon, // Utang & Piutang
  ChartLineUpIcon, // Investasi
  TargetIcon, // Budgets / Anggaran
  UsersThreeIcon, // Household & Anggota
  type Icon,
} from "@phosphor-icons/react";
import { ROUTES } from "./routes";

export type MenuItem = {
  title: string;
  url: string;
  icon: Icon;
  items?: MenuItem[];
};

export const dataMenu: MenuItem[] = [
  {
    title: "Dashboard",
    url: ROUTES.DASHBOARD,
    icon: GaugeIcon,
  },
  {
    title: "Transaksi & Transfer",
    url: ROUTES.TRANSACTIONS,
    icon: ArrowsDownUpIcon,
  },
  {
    title: "Dompet & Rekonsiliasi",
    url: ROUTES.WALLETS,
    icon: WalletIcon,
  },
  {
    title: "Utang & Piutang",
    url: ROUTES.DEBTS,
    icon: HandshakeIcon,
  },
  {
    title: "Investasi Portofolio",
    url: ROUTES.INVESTMENTS,
    icon: ChartLineUpIcon,
  },
  {
    title: "Anggaran / Budgets",
    url: ROUTES.BUDGETS,
    icon: TargetIcon,
  },
  {
    title: "Household & Akses",
    url: ROUTES.HOUSEHOLD,
    icon: UsersThreeIcon,
  },
];