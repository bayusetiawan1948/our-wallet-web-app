import { Outlet } from "react-router-dom";

import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppHeader } from "@/components/layouts/app-header";
import { Toaster } from "@/components/ui/sonner";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <Toaster position="top-right" richColors />
      </SidebarInset>
    </SidebarProvider>
  );
}