import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";

interface Props {
  childName: string;
  onBack: () => void;
  onSeePlans: () => void;
}

/** The free plan can create and preview a book but not order it (also enforced on the server). */
export const UpgradeGate = ({ childName, onBack, onSeePlans }: Props) => (
  <div className="min-h-screen bg-background pb-28 md:pb-12">
    <TopBar childName={childName} />
    <main className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/30">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="font-display mt-4 text-[22px] font-bold">Upgrade to order your book</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        Your free plan can create and preview books. Family and Premium unlock every page, PDF download and
        printed copies delivered to your door.
      </p>
      <div className="mt-6 flex gap-2">
        <Button variant="outline" onClick={onBack}>
          Back to preview
        </Button>
        <Button variant="warm" onClick={onSeePlans}>
          See plans
        </Button>
      </div>
    </main>
    <BottomNav />
  </div>
);
