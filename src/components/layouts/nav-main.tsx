import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CaretRightIcon, UserCheckIcon, ShieldCheckIcon, UserIcon } from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMockStore } from "@/lib/mock-store"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ElementType | React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const location = useLocation()
  const store = useMockStore()
  const activeUser = store.getActiveUser()
  const { setOpenMobile, isMobile } = useSidebar()

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      {/* Quick Role Switcher */}
      <div className="px-2 pb-3 pt-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between gap-2 border-primary/30 hover:border-primary/60 bg-card">
              <div className="flex items-center gap-2 truncate">
                {store.activeRole === "admin" ? (
                  <ShieldCheckIcon className="size-4 text-emerald-500 shrink-0" />
                ) : (
                  <UserIcon className="size-4 text-blue-500 shrink-0" />
                )}
                <span className="text-xs font-semibold truncate">
                  Role: <span className="font-bold text-foreground">{activeUser.name}</span>
                </span>
              </div>
              <Badge variant={store.activeRole === "admin" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                {store.activeRole.toUpperCase()}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Quick Role Switcher (Prototype)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => store.setRole("admin")}
              className={`cursor-pointer flex items-center justify-between ${store.activeRole === "admin" ? "bg-accent font-medium" : ""}`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="size-4 text-emerald-500" />
                <span>Bayu (Admin / Kepala Keluarga)</span>
              </div>
              {store.activeRole === "admin" && <UserCheckIcon className="size-4 text-emerald-500" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => store.setRole("member")}
              className={`cursor-pointer flex items-center justify-between ${store.activeRole === "member" ? "bg-accent font-medium" : ""}`}
            >
              <div className="flex items-center gap-2">
                <UserIcon className="size-4 text-blue-500" />
                <span>Annisa (Member / Pasangan)</span>
              </div>
              {store.activeRole === "member" && <UserCheckIcon className="size-4 text-blue-500" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon

          const isSubItemActive = (subUrl: string) => {
            if (subUrl === "/") return location.pathname === "/"
            return (
              location.pathname === subUrl ||
              location.pathname.startsWith(`${subUrl}/`)
            )
          }

          const hasActiveChild =
            item.items?.some((subItem) => isSubItemActive(subItem.url)) ?? false

          const isItemActive =
            item.url === "/"
              ? location.pathname === "/"
              : location.pathname === item.url ||
                location.pathname.startsWith(`${item.url}/`) ||
                hasActiveChild

          return (
            <Collapsible key={item.title} asChild defaultOpen={isItemActive || item.isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isItemActive} tooltip={item.title}>
                  <Link to={item.url} onClick={handleNavClick}>
                    {Icon &&
                      (React.isValidElement(Icon)
                        ? Icon
                        : typeof Icon === "function" || typeof Icon === "object"
                        ? React.createElement(Icon as React.ComponentType)
                        : null)}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <CaretRightIcon />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const active = isSubItemActive(subItem.url)
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={active}>
                                <Link to={subItem.url} onClick={handleNavClick}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
