import React from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export function AppHeader() {
  const items = useBreadcrumbs();
  const maxVisibleItems = 3;

  const isOverflow = items.length > maxVisibleItems;
  const firstItem = isOverflow ? items[0] : null;
  const lastItem = isOverflow ? items[items.length - 1] : null;
  const middleItems = isOverflow ? items.slice(1, items.length - 1) : [];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/40 px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {!isOverflow ? (
              items.map((item, index) => (
                <React.Fragment key={item.url}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {item.isCurrent ? (
                      <BreadcrumbPage>{item.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={item.url}>{item.title}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))
            ) : (
              <>
                {/* First item */}
                {firstItem && (
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={firstItem.url}>{firstItem.title}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                )}

                <BreadcrumbSeparator />

                {/* Dropdown Menu for middle overflow items */}
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="flex items-center gap-1 rounded-md p-1 hover:bg-accent focus:outline-hidden cursor-pointer"
                      aria-label="Show collapsed breadcrumb items"
                    >
                      <BreadcrumbEllipsis />
                      <span className="sr-only">Toggle breadcrumb menu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {middleItems.map((mid) => (
                        <DropdownMenuItem
                          key={mid.url}
                          asChild
                          className="cursor-pointer"
                        >
                          <Link to={mid.url}>{mid.title}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>

                <BreadcrumbSeparator />

                {/* Last item (Current page) */}
                {lastItem && (
                  <BreadcrumbItem>
                    <BreadcrumbPage>{lastItem.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
