import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AgePreview } from "@/components/childbook/AgePreview";
import { MilestoneTimelinePreview } from "@/components/childbook/MilestoneTimelinePreview";
import { cn } from "@/lib/utils";

export const OnboardingHeader = ({ isAddingAnother }: { isAddingAnother: boolean }) => (
  <>
    {isAddingAnother && (
      <Link
        to="/settings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to settings
      </Link>
    )}
    <div className="mb-6 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1 text-[12px] font-medium text-foreground/80 backdrop-blur">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        {isAddingAnother ? "Add another child" : "Step 1 of 1"}
      </span>
      <h1 className="font-display mt-3 text-3xl font-bold text-foreground">
        {isAddingAnother ? "Tell us about your next little one" : "Tell us about your little one"}
      </h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        {isAddingAnother
          ? "Each child gets their own private book — you can switch any time."
          : "We'll personalize every memory and milestone around them."}
      </p>
    </div>
  </>
);

export const DobField = ({ dob, name, month, onSelect, onMonthChange }: {
  dob: Date | undefined;
  name: string;
  month: Date;
  onSelect: (d: Date | undefined) => void;
  onMonthChange: (d: Date) => void;
}) => (
  <div className="space-y-1.5">
    <Label>Date of birth</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-11 w-full justify-start rounded-xl text-left font-normal", !dob && "text-muted-foreground")}
        >
          <CalendarIcon className="h-4 w-4" />
          {dob ? format(dob, "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dob}
          onSelect={onSelect}
          month={month}
          onMonthChange={onMonthChange}
          disabled={(d) => d > new Date()}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
    <AgePreview dob={dob} name={name} />
    <MilestoneTimelinePreview dob={dob} name={name} />
  </div>
);
