import {
  ChartLineUpIcon, // dashboard
  ArrowsDownUpIcon, // Cashflow
  WalletIcon, // Invesment
  HandshakeIcon, // Debts & Receivables
  GaugeIcon, // Wallet
  type Icon
} from "@phosphor-icons/react";
import { ROUTES } from "./routes";

export type MenuItem = {
  title: string;
  url: string;
  icon: Icon;
  items: MenuItem[];
};

export const dataMenu: MenuItem[] = [
  {
    title: 'Dashboard',
    url: ROUTES.DASHBOARD,
    icon: GaugeIcon,
    items: [],
  },
  {
    title: 'Cashflow',
    url: ROUTES.CASHFLOW,
    icon: ArrowsDownUpIcon,
    items: [],
  },
  {
    title: 'Wallet',
    url: ROUTES.WALLET,
    icon: WalletIcon,
    items: [],
  },
  {
    title: 'Investment',
    url: ROUTES.INVESTMENT,
    icon: ChartLineUpIcon,
    items: [],
  },
  {
    title: 'Debts & Receivables',
    url: ROUTES.DEBTS_RECEIVABLES,
    icon: HandshakeIcon,
    items: [],
  },
];
  