import { useState, useEffect, useCallback } from 'react';

interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseServerPaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export function useServerPagination<T>(
  fetcher: (page: number, pageSize: number) => Promise<PagedResponse<T>>,
  options: UseServerPaginationOptions = {}
) {
  const { initialPage = 1, pageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(page, pageSize);
      setData(result.data);
      setTotal(result.total);
      setCurrentPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [fetcher, pageSize]);

  useEffect(() => { load(initialPage); }, [load, initialPage]);

  function goToPage(page: number) {
    load(page);
  }

  function refresh() {
    load(currentPage);
  }

  return {
    data,
    total,
    currentPage,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    pageSize,
    loading,
    error,
    goToPage,
    refresh,
  };
}
