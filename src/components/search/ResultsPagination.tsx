import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number; // 0-indexed
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Numbered pager for the Find Contracts results. Shows up to 5 numeric
 * buttons centered on the current page with first/last anchors + ellipses.
 * 0-indexed internally; UI displays 1-indexed page numbers.
 */
export function ResultsPagination({ page, pageSize, total, onChange, disabled }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const current = page + 1; // 1-indexed for display
  const go = (p1: number) => {
    const next = Math.max(1, Math.min(totalPages, p1));
    if (next - 1 !== page) onChange(next - 1);
  };

  // Build the windowed list of page numbers + "..." sentinels.
  const pages: (number | "ellipsis-l" | "ellipsis-r")[] = [];
  const window = 1; // pages on each side of current within main window
  const start = Math.max(2, current - window);
  const end = Math.min(totalPages - 1, current + window);

  pages.push(1);
  if (start > 2) pages.push("ellipsis-l");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push("ellipsis-r");
  if (totalPages > 1) pages.push(totalPages);

  const startRow = page * pageSize + 1;
  const endRow = Math.min(total, (page + 1) * pageSize);

  return (
    <div className="flex flex-col items-center gap-2 mt-6">
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(current - 1)}
          disabled={disabled || current === 1}
          className="gap-1 h-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </Button>
        {pages.map((p, i) =>
          typeof p === "number" ? (
            <Button
              key={p}
              variant={p === current ? "default" : "outline"}
              size="sm"
              onClick={() => go(p)}
              disabled={disabled}
              className="h-8 min-w-[2rem] px-2"
              aria-current={p === current ? "page" : undefined}
            >
              {p}
            </Button>
          ) : (
            <span key={`${p}-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(current + 1)}
          disabled={disabled || current === totalPages}
          className="gap-1 h-8"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Showing {startRow.toLocaleString()}–{endRow.toLocaleString()} of {total.toLocaleString()} · Page {current} of {totalPages}
      </p>
    </div>
  );
}
