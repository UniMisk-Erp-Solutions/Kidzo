import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AutoDateInfo } from "@/hooks/useMemoryPhotos";

/** The time-of-day of `from`, applied to `date` (so an EXIF-derived time isn't wiped by a date pick). */
const withTimeOf = (date: Date, from: Date) => {
  const next = new Date(date);
  next.setHours(from.getHours(), from.getMinutes(), from.getSeconds(), 0);
  return next;
};

interface TimeProps {
  value: Date;
  onChange: (d: Date) => void;
}

const TimeRow = ({ value, onChange }: TimeProps) => (
  <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
    <Label htmlFor="happened-time" className="text-sm font-medium">
      Time
    </Label>
    <input
      id="happened-time"
      type="time"
      value={format(value, "HH:mm")}
      onChange={(e) => {
        const [h, m] = e.target.value.split(":").map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) return;
        const next = new Date(value);
        next.setHours(h, m, 0, 0);
        onChange(next);
      }}
      className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
);

interface Props {
  happenedAt: Date;
  month: Date;
  autoDate: AutoDateInfo | null;
  /** A day was picked (the time of day is kept). */
  onPickDate: (d: Date) => void;
  onTimeChange: (d: Date) => void;
  onMonthChange: (d: Date) => void;
}

/** "When": a date + time popover, with a note when the date was auto-filled from a photo. */
export const WhenPicker = ({ happenedAt, month, autoDate, onPickDate, onTimeChange, onMonthChange }: Props) => (
  <div className="space-y-1.5">
    <Label>When</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-11 w-full justify-start rounded-xl font-normal">
          <CalendarIcon className="h-4 w-4" />
          {format(happenedAt, "PPP 'at' h:mm a")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={happenedAt}
          onSelect={(d) => d && onPickDate(withTimeOf(d, happenedAt))}
          month={month}
          onMonthChange={onMonthChange}
          disabled={(d) => d > new Date()}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
        <TimeRow value={happenedAt} onChange={onTimeChange} />
      </PopoverContent>
    </Popover>
    {autoDate && (
      <p className="px-1 text-[12px] text-muted-foreground">
        {autoDate.source === "exif"
          ? "Auto-filled from photo metadata (date & time) — adjust any time."
          : "Auto-filled from file's last-modified — adjust any time."}
      </p>
    )}
  </div>
);
