import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/bookPricing";

interface Props {
  total: number;
  placing: boolean;
  onEdit: () => void;
  onPay: () => void;
}

/** Fixed bottom bar: the total, Edit book, and the Pay button. */
export const CheckoutBar = ({ total, placing, onEdit, onPay }: Props) => (
  <div className="fixed inset-x-0 bottom-0 z-[60] border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 md:px-6">
      {/* Phones: the amount is already on the Pay button, so the separate total is hidden. */}
      <div className="hidden text-[13px] sm:block">
        <span className="text-muted-foreground">Total</span> <span className="font-bold">{formatCurrency(total)}</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
        <Button variant="outline" size="sm" className="shrink-0 md:h-10 md:px-4" onClick={onEdit}>
          Edit book
        </Button>
        <Button size="sm" className="min-w-0 flex-1 md:h-10 md:flex-none md:px-4" onClick={onPay} disabled={placing}>
          {placing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> Pay {formatCurrency(total)}
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
);
