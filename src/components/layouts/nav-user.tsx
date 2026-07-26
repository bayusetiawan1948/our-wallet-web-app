"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getInitials } from "@/libs/utils";
import { useMockStore } from "@/lib/mock-store";
import {
  CaretUpDownIcon,
  SparkleIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BellIcon,
  SignOutIcon,
  ShieldCheckIcon,
  UserIcon,
  UserSwitchIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

export function NavUser({
  user: initialUser,
}: {
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const store = useMockStore();
  const activeUser = store.getActiveUser();

  const user = {
    name: activeUser.name,
    email: activeUser.email,
    avatar: store.activeRole === "admin" ? "/avatars/shadcn.jpg" : "/avatars/annisa.jpg",
    ...initialUser,
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <CaretUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium flex items-center justify-between">
                    {user.name}
                    <Badge variant={store.activeRole === "admin" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4 ml-1">
                      {store.activeRole.toUpperCase()}
                    </Badge>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5 px-2 py-1 font-semibold">
              <UserSwitchIcon className="size-3.5" /> Switch User / Role
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => store.setRole("admin")}
                className={`cursor-pointer flex items-center justify-between ${store.activeRole === "admin" ? "bg-accent font-medium" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-emerald-500" />
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold">Bayu</span>
                    <span className="text-[10px] text-muted-foreground">Admin / Kepala Keluarga</span>
                  </div>
                </div>
                {store.activeRole === "admin" && <CheckCircleIcon className="size-4 text-emerald-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => store.setRole("member")}
                className={`cursor-pointer flex items-center justify-between ${store.activeRole === "member" ? "bg-accent font-medium" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="size-4 text-blue-500" />
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold">Annisa</span>
                    <span className="text-[10px] text-muted-foreground">Member / Pasangan</span>
                  </div>
                </div>
                {store.activeRole === "member" && <CheckCircleIcon className="size-4 text-blue-500" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparkleIcon />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <CheckCircleIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <SignOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

