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
import { useMockStore } from "@/lib/mock-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircleNotchIcon, WarningIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";

export function AppHeader() {
  const items = useBreadcrumbs();
  const maxVisibleItems = 3;

  const isOverflow = items.length > maxVisibleItems;
  const firstItem = isOverflow ? items[0] : null;
  const lastItem = isOverflow ? items[items.length - 1] : null;
  const middleItems = isOverflow ? items.slice(1, items.length - 1) : [];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/40 px-4 bg-background/95 backdrop-blur-sm sticky top-0 z-30">
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
                {firstItem && (
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={firstItem.url}>{firstItem.title}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                )}

                <BreadcrumbSeparator />

                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                      <BreadcrumbEllipsis className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {middleItems.map((item) => (
                        <DropdownMenuItem key={item.url} asChild>
                          <Link to={item.url}>{item.title}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>

                <BreadcrumbSeparator />

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

      <HeaderStateControls />
    </header>
  );
}

function HeaderStateControls() {
  const store = useMockStore();
  const isLoading = store.simulatedLoading;
  const isError = store.simulatedError;

  return (
    <div className="flex items-center gap-2">
      {(isLoading || isError) && (
        <Badge
          variant="outline"
          className={`text-[10px] gap-1 animate-pulse ${
            isError
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-primary/50 bg-primary/10 text-primary"
          }`}
        >
          {isError ? (
            <>
              <WarningIcon className="size-3" /> State Error Aktif
            </>
          ) : (
            <>
              <CircleNotchIcon className="size-3 animate-spin" /> State Loading Aktif
            </>
          )}
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontalIcon className="size-4 text-primary" />
            <span className="hidden sm:inline">Simulasi State</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="p-2 text-xs font-semibold text-muted-foreground border-b border-border/40">
            Simulasi State UI (Testing)
          </div>
          <DropdownMenuItem
            onClick={() => {
              store.setSimulatedError(false);
              store.setSimulatedLoading(!isLoading);
            }}
            className="flex items-center justify-between text-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CircleNotchIcon className={`size-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
              <span>Simulasi Loading</span>
            </div>
            {isLoading && <Badge className="text-[10px] h-4 px-1">ON</Badge>}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              store.setSimulatedLoading(false);
              store.setSimulatedError(!isError);
            }}
            className="flex items-center justify-between text-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <WarningIcon className="size-4 text-destructive" />
              <span>Simulasi Error</span>
            </div>
            {isError && <Badge variant="destructive" className="text-[10px] h-4 px-1">ON</Badge>}
          </DropdownMenuItem>

          {(isLoading || isError) && (
            <DropdownMenuItem
              onClick={() => {
                store.setSimulatedLoading(false);
                store.setSimulatedError(false);
              }}
              className="text-xs text-muted-foreground justify-center border-t border-border/40 mt-1 pt-1"
            >
              Reset ke Normal
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
