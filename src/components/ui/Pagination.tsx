import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, totalPages, totalItems, pageSize, itemLabel, onPageChange, disabled }: PaginationProps) {
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return (
    <nav aria-label={`${itemLabel} pages`} className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
      <p className="text-sm text-muted" aria-live="polite">
        <span className="tabular-nums">
          {first}–{last}
        </span>{" "}
        of <span className="tabular-nums">{totalItems}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={disabled || page <= 1} aria-label="Previous page">
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <span className="hidden text-sm text-muted tabular-nums sm:inline">
          {page} / {totalPages}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={disabled || page >= totalPages} aria-label="Next page">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
