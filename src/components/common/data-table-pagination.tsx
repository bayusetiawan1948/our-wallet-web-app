import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

export interface DataPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function DataPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}: DataPaginationProps) {
  if (totalItems === 0) return null;

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 text-xs text-muted-foreground ${className}`}>
      <div>
        Menampilkan <span className="font-semibold text-foreground">{startRecord}</span> -{" "}
        <span className="font-semibold text-foreground">{endRecord}</span> dari{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> data
      </div>

      <Pagination className="w-auto mx-0">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <PaginationPrevious text="Previous" className="p-0 hover:bg-transparent" />
            </Button>
          </PaginationItem>

          <PaginationItem>
            <div className="px-3 py-1 bg-muted/50 rounded-md font-medium text-foreground text-xs">
              Halaman {page} dari {totalPages}
            </div>
          </PaginationItem>

          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <PaginationNext text="Next" className="p-0 hover:bg-transparent" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
