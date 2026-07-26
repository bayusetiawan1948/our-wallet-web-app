import { Skeleton } from "@/components/ui/skeleton";
import { CircleNotchIcon } from "@phosphor-icons/react";

export function DataTableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3 my-2">
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/40">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="rounded-md border border-border/60 overflow-hidden bg-card/20">
        <div className="h-10 bg-muted/40 px-4 flex items-center gap-4 border-b border-border/50">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 rounded" />
          ))}
        </div>

        <div className="divide-y divide-border/40">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="p-4 flex items-center gap-4">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={c} className="h-5 flex-1 rounded opacity-80" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/2 rounded" />
            <Skeleton className="size-8 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <div className="pt-2 border-t border-border/40 flex justify-between">
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/60 p-4 bg-card/40 space-y-2">
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-7 w-1/2 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 my-2 p-4 rounded-xl border border-border/60 bg-card/40">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5 p-3 bg-muted/30 rounded-lg">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-36 rounded" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function InlineSpinner({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
      <CircleNotchIcon className="size-5 animate-spin text-primary" />
      <span>{label}</span>
    </div>
  );
}
