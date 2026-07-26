import { WarningCircleIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Terjadi Kesalahan",
  message = "Gagal memuat data dari server. Silakan periksa koneksi Anda dan coba lagi.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-xl border border-destructive/30 bg-destructive/5 backdrop-blur-xs my-4 ${className}`}
    >
      <div className="flex items-center justify-center size-14 rounded-2xl bg-destructive/15 text-destructive mb-4 ring-1 ring-destructive/20 shadow-inner">
        <WarningCircleIcon className="size-7" weight="duotone" />
      </div>

      <h3 className="text-base font-semibold text-foreground mb-1 tracking-tight">
        {title}
      </h3>

      <p className="text-xs md:text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2 text-xs h-9 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        >
          <ArrowClockwiseIcon className="size-3.5" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
