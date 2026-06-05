import { useNavigate } from "react-router-dom";
import { Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CreateMomentCTA = () => {
  const navigate = useNavigate();
  return (
    <section
      aria-label="Create a memory"
      className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7 animate-fade-in-up"
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/20 blur-2xl" aria-hidden />
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary/25 text-secondary">
            <Heart className="h-6 w-6" strokeWidth={2.2} fill="currentColor" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              What's worth remembering today?
            </h2>
            <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">
              A photo, a sentence, a tiny win — they all matter.
            </p>
          </div>
        </div>
        <Button variant="warm" size="lg" className="w-full sm:w-auto" onClick={() => navigate("/moments/new")}>
          <Plus className="h-5 w-5" strokeWidth={2.4} />
          Create a Memory
        </Button>
      </div>
    </section>
  );
};
