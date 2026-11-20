import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { yearRangeLabel } from "@/lib/exportShareHelpers";

interface Props {
  safePage: number;
  pageCount: number;
  pageYears: number[];
  pageLoading: boolean;
  onPage: (page: number) => void;
}

/** Previous / next arrows between pages of years. */
export const ExportYearPager = ({ safePage, pageCount, pageYears, pageLoading, onPage }: Props) => (
  <nav aria-label="Year pages" className="flex items-center justify-between gap-3 pt-1">
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-full"
      aria-label="Previous years"
      disabled={safePage === 0 || pageLoading}
      onClick={() => onPage(safePage - 1)}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <div className="text-center">
      <div className="text-sm font-semibold text-foreground">
        Page {safePage + 1} of {pageCount}
      </div>
      <div className="text-xs text-muted-foreground">{yearRangeLabel(pageYears)}</div>
    </div>
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-full"
      aria-label="Next years"
      disabled={safePage >= pageCount - 1 || pageLoading}
      onClick={() => onPage(safePage + 1)}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  </nav>
);
