import React from "react";
import { FolderOpenIcon, MagnifyingGlassIcon, PlusIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  resetLabel?: string;
  onReset?: () => void;
  isFiltered?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderOpenIcon,
  title = "Tidak ada data",
  description = "Belum ada data yang tercatat atau sesuai dengan pencarian Anda.",
  actionLabel,
  onAction,
  resetLabel = "Reset Filter",
  onReset,
  isFiltered = false,
  className = "",
}: EmptyStateProps) {
  const DisplayIcon = isFiltered ? MagnifyingGlassIcon : Icon;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-xl border border-dashed border-border/70 bg-card/40 backdrop-blur-xs my-4 ${className}`}
    >
      <div className="flex items-center justify-center size-14 rounded-2xl bg-muted/60 text-muted-foreground mb-4 shadow-inner ring-1 ring-border/50">
        <DisplayIcon className="size-7 text-primary/80" weight="duotone" />
      </div>

      <h3 className="text-base font-semibold text-foreground mb-1 tracking-tight">
        {isFiltered ? "Hasil Tidak Ditemukan" : title}
      </h3>

      <p className="text-xs md:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {isFiltered
          ? "Tidak ada data yang cocok dengan kriteria pencarian atau filter yang Anda terapkan."
          : description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {isFiltered && onReset && (
          <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5 text-xs h-9">
            <ArrowClockwiseIcon className="size-3.5" />
            {resetLabel}
          </Button>
        )}

        {!isFiltered && actionLabel && onAction && (
          <Button size="sm" onClick={onAction} className="gap-1.5 text-xs h-9 shadow-xs">
            <PlusIcon className="size-3.5" weight="bold" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
