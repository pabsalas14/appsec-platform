import { useEffect, useMemo, useState } from 'react';

/** Tamaños de página habituales para tablas de catálogo (BRD A1). */
export const CATALOG_PAGE_SIZES = [10, 25, 50] as const;

/**
 * Paginación client-side sobre un array ya filtrado.
 * Reinicia a la página 0 cuando cambian `resetDeps` (p. ej. texto de búsqueda).
 */
export function useClientPagedList<T>(items: T[], resetDeps: unknown[] = []) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- API intencional: reinicio al filtrar
  }, resetDeps);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, pageCount - 1);

  const paged = useMemo(() => {
    const start = safePage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    paged,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    total,
    from: total === 0 ? 0 : safePage * pageSize + 1,
    to: Math.min((safePage + 1) * pageSize, total),
  };
}
