import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useActiveChild } from "@/hooks/useActiveChild";

interface Props {
  step: "memories" | "customize" | "preview" | "checkout";
  title: string;
  description: string;
}

const STEP_NUM: Record<Props["step"], number> = {
  memories: 1,
  customize: 2,
  preview: 3,
  checkout: 4,
};

export const BookStub = ({ step, title, description }: Props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: child } = useActiveChild();

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-12">
      <TopBar childName={child?.name ?? ""} />
      <main className="mx-auto max-w-2xl px-6 py-6 md:max-w-4xl md:py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/books")} className="-ml-3 mb-3">
          <ArrowLeft className="h-4 w-4" /> My books
        </Button>

        <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/40">
            <Sparkles className="h-8 w-8 text-accent-foreground" />
          </span>
          <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Step {STEP_NUM[step]} of 4
          </div>
          <h1 className="mt-2 text-[22px] font-bold tracking-tight">{title}</h1>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {description}
          </p>
          <p className="mx-auto mt-5 max-w-md rounded-xl bg-card px-4 py-3 text-[13px] text-muted-foreground shadow-soft">
            Coming in the next phase. Your book draft <span className="font-mono text-[12px]">{id?.slice(0, 8)}…</span> is saved.
          </p>
          <Button variant="outline" className="mt-5" onClick={() => navigate("/books")}>
            Back to my books
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};
