import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsDownUpIcon,
  XIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { type SortRule, type FilterConfig } from "@/hooks/use-data-controls";

export interface DataTableToolbarProps<T> {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  
  // Filters
  filterConfigs?: FilterConfig<T>[];
  filters: Record<string, unknown>;
  onFilterChange: (id: string, value: unknown) => void;
  onClearFilters: () => void;
  activeFilterCount: number;

  // Sorting
  sortOptions?: { label: string; rules: SortRule<T>[] }[];
  currentSortIndex?: number;
  onSortChange?: (index: number) => void;

  className?: string;
}

export function DataTableToolbar<T>({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filterConfigs = [],
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  sortOptions = [],
  currentSortIndex = 0,
  onSortChange,
  className = "",
}: DataTableToolbarProps<T>) {
  const isSingleFilter = filterConfigs.length === 1;
  const isMultipleFilter = filterConfigs.length > 1;

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-8 h-9 text-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      {/* Filter and Sort Group */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Single Filter Dropdown */}
        {isSingleFilter && (
          <div className="min-w-[140px]">
            <Select
              value={String(filters[filterConfigs[0].id] || "all")}
              onValueChange={(val) => onFilterChange(filterConfigs[0].id, val)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={filterConfigs[0].label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua {filterConfigs[0].label}</SelectItem>
                {filterConfigs[0].options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Multiple Filters via Popover / Sheet Filter Bar */}
        {isMultipleFilter && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 border-dashed">
                <FunnelIcon className="size-3.5 text-muted-foreground" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-semibold bg-primary/15 text-primary">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-4 shadow-lg" align="end">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <FunnelIcon className="size-3.5 text-primary" />
                  Filter Data
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    Reset Filter
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {filterConfigs.map((config) => (
                  <div key={config.id} className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {config.label}
                    </Label>
                    {config.type === "select" && (
                      <Select
                        value={String(filters[config.id] || "all")}
                        onValueChange={(val) => onFilterChange(config.id, val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={`Pilih ${config.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua {config.label}</SelectItem>
                          {config.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {config.type === "text" && (
                      <Input
                        type="text"
                        placeholder={`Cari ${config.label}...`}
                        value={String(filters[config.id] || "")}
                        onChange={(e) => onFilterChange(config.id, e.target.value)}
                        className="h-8 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Sorting Dropdown */}
        {sortOptions.length > 0 && (
          <Select
            value={String(currentSortIndex)}
            onValueChange={(val) => onSortChange && onSortChange(Number(val))}
          >
            <SelectTrigger className="h-9 text-xs min-w-[150px]">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowsDownUpIcon className="size-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Urutkan" />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              {sortOptions.map((opt, idx) => (
                <SelectItem key={idx} value={String(idx)}>
                  <div className="flex items-center justify-between w-full">
                    <span>{opt.label}</span>
                    {currentSortIndex === idx && (
                      <CheckIcon className="size-3 text-primary ml-2 shrink-0" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters Button (When active) */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
          >
            <XIcon className="size-3" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
