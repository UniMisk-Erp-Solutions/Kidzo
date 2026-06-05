import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { exportKeepsakePdf } from "@/lib/exportPdf";
import type { Memory } from "@/hooks/useMemories";
import type { Achievement } from "@/hooks/useAchievements";

interface Props {
  childName: string;
  childDob: Date;
  memories: Memory[];
  achievements: Achievement[];
}

export const ExportKeepsakeButton = ({ childName, childDob, memories, achievements }: Props) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const allDates = [
    ...memories.map((m) => new Date(m.happened_at).getFullYear()),
    ...achievements.map((a) => new Date(a.achievement_date).getFullYear()),
  ];
  const minYear = allDates.length ? Math.min(...allDates) : new Date().getFullYear();
  const maxYear = allDates.length ? Math.max(...allDates) : new Date().getFullYear();

  const [fromYear, setFromYear] = useState<number>(minYear);
  const [toYear, setToYear] = useState<number>(maxYear);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeStories, setIncludeStories] = useState(true);
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
    if (memories.length === 0 && achievements.length === 0) {
      toast.error("Nothing to export yet — add a memory first.");
      return;
    }
    const fy = Math.min(fromYear, toYear);
    const ty = Math.max(fromYear, toYear);
    const inRangeMemories = memories.filter((m) => {
      const y = new Date(m.happened_at).getFullYear();
      return y >= fy && y <= ty;
    });
    const inRangeAchievements = includeAchievements
      ? achievements.filter((a) => {
          const y = new Date(a.achievement_date).getFullYear();
          return y >= fy && y <= ty;
        })
      : [];
    if (inRangeMemories.length + inRangeAchievements.length === 0) {
      toast.error(`Nothing in ${fy}–${ty} to export`, {
        description: `Try widening the year range — your memories range from ${minYear} to ${maxYear}.`,
      });
      return;
    }
    setBusy(true);
    const t = toast.loading("Crafting your keepsake…");
    const startedAt = performance.now();
    try {
      const report = await exportKeepsakePdf({
        childName,
        childDob,
        memories,
        achievements,
        fromYear: fy,
        toYear: ty,
        includePhotos,
        includeStories,
        includeAchievements,
      });
      const ms = Math.round(performance.now() - startedAt);
      console.info("[keepsake] export complete", { ms, ...report });
      if (report.failedImages.length > 0) {
        // Partial success — surface which photos couldn't be embedded.
        const preview = report.failedImages.slice(0, 3).join("\n");
        const more = report.failedImages.length > 3 ? `\n…and ${report.failedImages.length - 3} more` : "";
        toast.warning(
          `Saved with ${report.failedImages.length} missing photo${report.failedImages.length === 1 ? "" : "s"}`,
          {
            id: t,
            description: `${report.imagesLoaded}/${report.imagesAttempted} photos embedded.\n${preview}${more}`,
            duration: 9000,
          },
        );
      } else {
        toast.success("Keepsake saved 💛", {
          id: t,
          description: `${report.totalItems} item${report.totalItems === 1 ? "" : "s"} included${
            report.imagesLoaded ? ` · ${report.imagesLoaded} photo${report.imagesLoaded === 1 ? "" : "s"}` : ""
          }.`,
        });
      }
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[keepsake] export failed", {
        error: e,
        memoryCount: inRangeMemories.length,
        achievementCount: inRangeAchievements.length,
        photoUrls: [
          ...inRangeMemories.map((m) => m.photo_url).filter(Boolean),
          ...inRangeAchievements.map((a) => a.photo_url).filter(Boolean),
        ],
        fromYear: fy,
        toYear: ty,
      });
      toast.error("Couldn't generate PDF", {
        id: t,
        description: `${msg}\n\nTried ${inRangeMemories.length} memor${
          inRangeMemories.length === 1 ? "y" : "ies"
        } + ${inRangeAchievements.length} achievement${
          inRangeAchievements.length === 1 ? "" : "s"
        }. Open the browser console for full details.`,
        duration: 12000,
      });
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
      <DialogContent className="rounded-2xl sm:max-w-md">
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
              <Label htmlFor="ph" className="text-sm font-normal">Include photos</Label>
              <Switch id="ph" checked={includePhotos} onCheckedChange={setIncludePhotos} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="st" className="text-sm font-normal">Include stories & notes</Label>
              <Switch id="st" checked={includeStories} onCheckedChange={setIncludeStories} />
            </div>
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
          <Button variant="warm" onClick={handle} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
