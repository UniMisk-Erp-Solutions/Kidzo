import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLAN_BLURB: Record<string, string> = {
  premium: "Premium: unlimited files in every folder, including achievement certificates.",
  family: "Family: 1 birth certificate, 3 vaccination records, 20 marksheets and 7 school certificates. Upgrade to Premium for unlimited files and achievement certificates.",
};
const FREE_BLURB = "Free plan: every folder except achievement certificates, with smaller limits (1 birth certificate, 1 vaccination record, 5 marksheets, 2 school certificates). Upgrade for more space.";

interface Props {
  total: number;
  planSlug: string | null;
  planLoading: boolean;
  onUpgrade: () => void;
}

/** "Your vault": how many documents are stored, what the plan allows, and an upgrade button. */
export const VaultSummary = ({ total, planSlug, planLoading, onUpgrade }: Props) => (
  <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Your vault</p>
        <p className="mt-0.5 text-[22px] font-bold text-foreground">
          {total}
          <span className="text-[15px] font-medium text-muted-foreground"> document{total === 1 ? "" : "s"} stored</span>
        </p>
      </div>
      {!planLoading && planSlug !== "premium" && (
        <Button variant="warm" size="sm" onClick={onUpgrade}>
          <Sparkles className="h-4 w-4" /> {planSlug === "family" ? "Go Premium" : "Upgrade for more"}
        </Button>
      )}
    </div>
    {!planLoading && (
      <p className="mt-3 text-[13px] text-muted-foreground">{(planSlug && PLAN_BLURB[planSlug]) || FREE_BLURB}</p>
    )}
  </section>
);
