import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { ROUTES } from "@/consts/routes";

import { MainLayout } from "@/components/layouts/main-layout";
import { ProtectedRoute } from "@/components/common/protected-route";

import Dashboard from "@/pages/dashboard/page";
import TransactionsPage from "@/pages/transactions/page";
import WalletsPage from "@/pages/wallets/page";
import DebtsReceivablesPage from "@/pages/debts/page";
import InvestmentPage from "@/pages/investments/page";
import BudgetsPage from "@/pages/budgets/page";
import HouseholdPage from "@/pages/household/page";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import OnboardingHouseholdPage from "@/pages/auth/onboarding-household";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/onboarding/household"
        element={
          <ProtectedRoute>
            <OnboardingHouseholdPage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.TRANSACTIONS} element={<TransactionsPage />} />
        <Route path={ROUTES.WALLETS} element={<WalletsPage />} />
        <Route path={ROUTES.DEBTS} element={<DebtsReceivablesPage />} />
        <Route path={ROUTES.INVESTMENTS} element={<InvestmentPage />} />
        <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
        <Route path={ROUTES.HOUSEHOLD} element={<HouseholdPage />} />
      </Route>
    </>
  )
);
