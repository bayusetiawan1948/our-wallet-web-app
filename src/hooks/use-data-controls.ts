import { useState, useMemo } from "react";

export type SortOrder = "asc" | "desc";

export interface SortRule<T> {
  field: keyof T | string;
  order: SortOrder;
  label?: string;
  getValue?: (item: T) => string | number | Date | boolean | null | undefined;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig<T> {
  id: string;
  label: string;
  type: "select" | "multiselect" | "text" | "date-range";
  options?: FilterOption[];
  predicate?: (item: T, filterValue: unknown) => boolean;
}

export interface UseDataControlsOptions<T> {
  data: T[];
  searchFields?: (keyof T | string)[];
  searchPredicate?: (item: T, query: string) => boolean;
  initialSort?: SortRule<T>[];
  initialFilters?: Record<string, unknown>;
  initialPageSize?: number;
}

export function useDataControls<T>({
  data = [],
  searchFields = [],
  searchPredicate,
  initialSort = [],
  initialFilters = {},
  initialPageSize = 10,
}: UseDataControlsOptions<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>(initialFilters);
  const [sortRules, setSortRules] = useState<SortRule<T>[]>(initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        if (searchPredicate) {
          if (!searchPredicate(item, q)) return false;
        } else if (searchFields.length > 0) {
          const matches = searchFields.some((field) => {
            const val = (item as Record<string, unknown>)[field as string];
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(q);
          });
          if (!matches) return false;
        } else {
          // Default stringify search across all values
          const str = JSON.stringify(item).toLowerCase();
          if (!str.includes(q)) return false;
        }
      }

      // 2. Custom Active Filters
      for (const [filterId, filterVal] of Object.entries(filters)) {
        if (
          filterVal === undefined ||
          filterVal === null ||
          filterVal === "" ||
          (Array.isArray(filterVal) && filterVal.length === 0) ||
          filterVal === "all"
        ) {
          continue;
        }

        const itemVal = (item as Record<string, unknown>)[filterId];

        if (Array.isArray(filterVal)) {
          if (!filterVal.includes(String(itemVal))) return false;
        } else if (typeof filterVal === "string" || typeof filterVal === "number" || typeof filterVal === "boolean") {
          if (String(itemVal) !== String(filterVal)) return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, searchFields, searchPredicate, filters]);

  // Sorting Logic (Supports Multi-field sorting)
  const sortedData = useMemo(() => {
    if (sortRules.length === 0) return filteredData;

    return [...filteredData].sort((a, b) => {
      for (const rule of sortRules) {
        let valA: unknown;
        let valB: unknown;

        if (rule.getValue) {
          valA = rule.getValue(a);
          valB = rule.getValue(b);
        } else {
          valA = (a as Record<string, unknown>)[rule.field as string];
          valB = (b as Record<string, unknown>)[rule.field as string];
        }

        if (valA === valB) continue;

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const comp =
          typeof valA === "number" && typeof valB === "number"
            ? valA - valB
            : valA instanceof Date && valB instanceof Date
            ? valA.getTime() - valB.getTime()
            : String(valA).localeCompare(String(valB), "id", { numeric: true, sensitivity: "base" });

        return rule.order === "asc" ? comp : -comp;
      }
      return 0;
    });
  }, [filteredData, sortRules]);

  // Pagination Math
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Helper actions
  const setFilter = (id: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [id]: value }));
    setPage(1);
  };

  const removeFilter = (id: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPage(1);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery("");
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    for (const val of Object.values(filters)) {
      if (
        val !== undefined &&
        val !== null &&
        val !== "" &&
        val !== "all" &&
        (!Array.isArray(val) || val.length > 0)
      ) {
        count++;
      }
    }
    if (searchQuery.trim()) count++;
    return count;
  }, [filters, searchQuery]);

  return {
    // Data
    paginatedData,
    filteredData,
    sortedData,
    totalItems,

    // Search
    searchQuery,
    setSearchQuery: (query: string) => {
      setSearchQuery(query);
      setPage(1);
    },

    // Filters
    filters,
    setFilter,
    removeFilter,
    clearAllFilters,
    activeFilterCount,

    // Sorting
    sortRules,
    setSortRules: (rules: SortRule<T>[]) => {
      setSortRules(rules);
      setPage(1);
    },

    // Pagination
    page: currentPage,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
  };
}
