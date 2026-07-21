import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { ROUTES } from "@/consts/routes";

import { MainLayout } from "@/components/layouts/main-layout";

import Dashboard from "@/pages/dashboard/page";
import CashflowPage from "@/pages/cashflow/page";
import DebtsReceivablesPage from "@/pages/debts-receivable/page";
import InvestmentPage from "@/pages/investment/page";
import WalletPage from "@/pages/wallet/page";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<MainLayout />}>
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.WALLET} element={<WalletPage />} />
        <Route path={ROUTES.CASHFLOW} element={<CashflowPage />} />
        <Route path={ROUTES.INVESTMENT} element={<InvestmentPage />} />
        <Route path={ROUTES.DEBTS_RECEIVABLES} element={<DebtsReceivablesPage />} />
      </Route>
    </>
  )
);
