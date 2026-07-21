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
} from "@/components/ui/sidebar"
import { CaretRightIcon } from "@phosphor-icons/react"

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

  return (
    <SidebarGroup>
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
                  <Link to={item.url}>
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
                                <Link to={subItem.url}>
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

