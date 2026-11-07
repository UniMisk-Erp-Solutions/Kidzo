import { format } from "date-fns";
import { CalendarIcon, Loader2, X, Camera, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AchievementType } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";

export interface AchievementFormValues {
  type: AchievementType;
  subject: string;
  date: Date;
  grade: string;
  notes: string;
}

const AttachmentPreview = ({ file, preview }: { file: File | null; preview: string }) =>
  file?.type === "application/pdf" ? (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
      <FileText className="h-10 w-10" />
      <span className="max-w-full truncate text-[13px] font-medium text-foreground">{file.name}</span>
    </div>
  ) : (
    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
  );

const PhotoPicker = ({ file, preview, onPhoto }: { file: File | null; preview: string | null; onPhoto: (file: File | null) => void }) => (
  <div className="space-y-1.5">
    <Label>Photo / certificate — image or PDF (optional)</Label>
    <label
      htmlFor="ach-photo"
      className={cn(
        "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 transition-all hover:border-primary/40",
        preview ? "aspect-[4/3]" : "h-32",
      )}
    >
      {preview ? (
        <>
          <AttachmentPreview file={file} preview={preview} />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onPhoto(null);
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft hover:bg-background"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
          <Camera className="h-5 w-5" />
          <span className="text-[13px] font-medium">Tap to upload a photo or PDF</span>
        </div>
      )}
      <input id="ach-photo" type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
    </label>
  </div>
);

const TypeAndDate = ({ values, onChange }: {
  values: AchievementFormValues; onChange: (patch: Partial<AchievementFormValues>) => void;
}) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-1.5">
      <Label htmlFor="ach-type">Type</Label>
      <Select value={values.type} onValueChange={(v) => onChange({ type: v as AchievementType })}>
        <SelectTrigger id="ach-type" className="h-11 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="academics">Academics</SelectItem>
          <SelectItem value="sports">Sports</SelectItem>
          <SelectItem value="cultural">Cultural</SelectItem>
          <SelectItem value="certifications">Certifications</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-1.5">
      <Label>Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="h-11 w-full justify-start gap-2 rounded-xl px-3 font-normal">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{format(values.date, "PP")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={values.date}
            onSelect={(d) => d && onChange({ date: d })}
            disabled={(d) => d > new Date()}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  </div>
);

const TextFields = ({ values, onChange }: {
  values: AchievementFormValues; onChange: (patch: Partial<AchievementFormValues>) => void;
}) => (
  <>
    <div className="space-y-1.5">
      <Label htmlFor="ach-subject">Subject / title</Label>
      <Input
        id="ach-subject"
        value={values.subject}
        onChange={(e) => onChange({ subject: e.target.value })}
        placeholder="Math Olympiad, Piano Recital..."
        className="h-11 rounded-xl"
        required
      />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="ach-grade">Grade / score (optional)</Label>
      <Input
        id="ach-grade"
        value={values.grade}
        onChange={(e) => onChange({ grade: e.target.value })}
        placeholder="A+, 1st place, Level 3..."
        className="h-11 rounded-xl"
      />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="ach-notes">Notes (optional)</Label>
      <Textarea
        id="ach-notes"
        value={values.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        rows={3}
        className="rounded-xl"
        placeholder="A few words to remember it by..."
      />
    </div>
  </>
);

interface AddAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: AchievementFormValues;
  onChange: (patch: Partial<AchievementFormValues>) => void;
  photoFile: File | null;
  photoPreview: string | null;
  onPhoto: (file: File | null) => void;
  saving: boolean;
  onSubmit: () => void;
}

export const AddAchievementDialog = ({ open, onOpenChange, values, onChange, photoFile, photoPreview, onPhoto, saving, onSubmit }: AddAchievementDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {/* Phones: a narrower bottom sheet that slides up and is as tall as the form needs, so nothing has to scroll. Larger screens: centered dialog. */}
    <DialogContent
      className="sheet-up scrollbar-hide w-[88%] max-w-sm overflow-y-auto rounded-3xl max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[calc(100dvh_-_1rem)] max-sm:translate-y-0 max-sm:rounded-b-none sm:max-h-[90vh] sm:max-w-md"
    >
      <DialogHeader>
        <DialogTitle>Add achievement</DialogTitle>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <PhotoPicker file={photoFile} preview={photoPreview} onPhoto={onPhoto} />
        <TypeAndDate values={values} onChange={onChange} />
        <TextFields values={values} onChange={onChange} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="warm" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save & Celebrate
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
