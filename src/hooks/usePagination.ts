import { useState, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export function usePagination<T>(items: T[], options: UsePaginationOptions = {}) {
  const { initialPage = 1, pageSize: initialPageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / currentPageSize));

  // Clamp page when items or page size changes
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * currentPageSize;
    return items.slice(start, start + currentPageSize);
  }, [items, safePage, currentPageSize]);

  function goToPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }

  function reset() {
    setCurrentPage(1);
  }

  function changePageSize(size: number) {
    setCurrentPageSize(size);
    setCurrentPage(1); // Reset to page 1 on size change
  }

  return {
    items: paginatedItems,
    currentPage: safePage,
    totalPages,
    totalItems: items.length,
    pageSize: currentPageSize,
    goToPage,
    reset,
    changePageSize,
  };
}
