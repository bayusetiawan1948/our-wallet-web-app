import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Memuat sesi...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user.household_id && location.pathname !== "/onboarding/household") {
    return <Navigate to="/onboarding/household" replace />;
  }

  return <>{children}</>;
}
