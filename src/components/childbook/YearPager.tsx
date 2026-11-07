import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** 0-based current page. */
  page: number;
  pageCount: number;
  /** The years on this page, in display order (first = leading year). */
  years: number[];
  loading?: boolean;
  onPage: (page: number) => void;
}

/** "Page 2 of 4 · 2020 – 2015" with previous / next buttons, for the year-paged lists (6 years per page). */
export const YearPager = ({ page, pageCount, years, loading, onPage }: Props) => {
  if (pageCount <= 1) return null;
  const first = years[0];
  const last = years[years.length - 1];
  return (
    <nav aria-label="Year pages" className="flex items-center justify-between gap-3 pt-2">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full"
        aria-label="Previous years"
        disabled={page === 0 || loading}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-center">
        <div className="text-sm font-semibold text-foreground">
          Page {page + 1} of {pageCount}
        </div>
        <div className="text-xs text-muted-foreground">{first === last ? first : `${first} – ${last}`}</div>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full"
        aria-label="Next years"
        disabled={page >= pageCount - 1 || loading}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};
