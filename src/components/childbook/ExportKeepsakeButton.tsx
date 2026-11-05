import { useEffect, useState } from "react";
import { Download, Loader2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { runKeepsakeExport } from "./keepsakeExport";
import { useFeatureGuard } from "@/hooks/useFeatureGuard";
import { useEntitlements } from "@/hooks/useEntitlements";
import type { Memory } from "@/hooks/useMemories";
import type { Achievement } from "@/hooks/useAchievements";

interface Props {
  childName: string;
  memories: Memory[];
  achievements: Achievement[];
}

export const ExportKeepsakeButton = ({ childName, memories, achievements }: Props) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const guard = useFeatureGuard();
  const navigate = useNavigate();
  const { can, loading: planLoading } = useEntitlements();
  // Plan known and it doesn't include PDF export (free plan): the button sends people to the plans instead.
  const locked = !planLoading && !can("pdf_export");

  const allDates = [
    ...memories.map((m) => new Date(m.happened_at).getFullYear()),
    ...achievements.map((a) => new Date(a.achievement_date).getFullYear()),
  ];
  const minYear = allDates.length ? Math.min(...allDates) : new Date().getFullYear();
  const maxYear = allDates.length ? Math.max(...allDates) : new Date().getFullYear();

  const [fromYear, setFromYear] = useState<number>(minYear);
  const [toYear, setToYear] = useState<number>(maxYear);
  const [includeAchievements, setIncludeAchievements] = useState(true);

  // Keep the year range in sync as memories/achievements load in (the
  // dialog mounts before async data arrives, so the initial defaults
  // would otherwise filter everything out).
  useEffect(() => {
    setFromYear(minYear);
    setToYear(maxYear);
  }, [minYear, maxYear]);

  const handle = async () => {
    if (busy) return;
    if (!guard("pdf_export", "PDF export")) { setOpen(false); return; }
    setBusy(true);
    try {
      const done = await runKeepsakeExport({ childName, memories, achievements, fromYear, toYear, includeAchievements, minYear, maxYear });
      if (done) setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
          Export keepsake
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[88%] max-w-sm rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export keepsake PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <Label className="mb-2 block text-sm">Year range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={fromYear}
                min={1900}
                max={toYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
                className="h-10 rounded-xl"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                value={toYear}
                min={fromYear}
                max={2100}
                onChange={(e) => setToYear(Number(e.target.value))}
                className="h-10 rounded-xl"
              />
            </div>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Available: {minYear} – {maxYear}
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ac" className="text-sm font-normal">Include achievements</Label>
              <Switch id="ac" checked={includeAchievements} onCheckedChange={setIncludeAchievements} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          {locked ? (
            <Button
              variant="warm"
              onClick={() => {
                setOpen(false);
                navigate("/pricing-plans");
              }}
            >
              <Lock className="h-4 w-4" />
              Upgrade to view
            </Button>
          ) : (
            <Button variant="warm" onClick={handle} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Generate PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
