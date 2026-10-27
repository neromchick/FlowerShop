import { Fragment } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      (page >= currentPage - 1 && page <= currentPage + 1)
  );

  return (
    <nav className={`flex items-center justify-center space-x-2 ${className}`} aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-xs font-mono text-zinc-700 bg-[#F7F7F5] border border-zinc-200 rounded-md hover:bg-zinc-200/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Предыдущая страница"
      >
        ← Назад
      </button>

      {visiblePages.map((page, index) => {
        const prevPage = visiblePages[index - 1];
        const showEllipsis = prevPage && page - prevPage > 1;

        return (
          <Fragment key={page}>
            {showEllipsis && (
              <span className="px-1 text-xs font-mono text-zinc-400">…</span>
            )}
            <button
              onClick={() => onPageChange(page)}
              className={`min-w-[32px] h-8 px-2 text-xs font-mono rounded-md transition-colors ${
                page === currentPage
                  ? 'bg-zinc-900 text-white font-medium'
                  : 'text-zinc-700 bg-[#F7F7F5] border border-zinc-200 hover:bg-zinc-200/80'
              }`}
              aria-label={`Страница ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          </Fragment>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-xs font-mono text-zinc-700 bg-[#F7F7F5] border border-zinc-200 rounded-md hover:bg-zinc-200/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Следующая страница"
      >
        Вперёд →
      </button>
    </nav>
  );
}
