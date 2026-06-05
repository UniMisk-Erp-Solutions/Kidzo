import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useCalendarMemory } from "@/hooks/useCalendarMemory";
import { AgePreview } from "@/components/childbook/AgePreview";
import { MilestoneTimelinePreview } from "@/components/childbook/MilestoneTimelinePreview";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const ACTIVE_KEY = "childbook:activeChildId";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: existing, isLoading } = useActiveChild();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const isAddingAnother = searchParams.get("addChild") === "1";

  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [pronouns, setPronouns] = useState("");
  const [saving, setSaving] = useState(false);
  const { month: dobMonth, setMonth: setDobMonth } = useCalendarMemory(
    "onboarding-dob",
    new Date(2022, 0),
  );

  useEffect(() => {
    // Only auto-redirect if this is initial onboarding (not adding another child)
    if (!isAddingAnother && !isLoading && existing) navigate("/home", { replace: true });
  }, [existing, isLoading, navigate, isAddingAnother]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dob) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("child_profiles")
      .insert({
        user_id: user.id,
        name,
        dob: format(dob, "yyyy-MM-dd"),
        pronouns: pronouns || null,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error(error?.message ?? "Couldn't add child");
      return;
    }
    // Make the new child the active one
    localStorage.setItem(ACTIVE_KEY, data.id);
    window.dispatchEvent(new CustomEvent("childbook:active-child-changed"));
    qc.invalidateQueries({ queryKey: ["children"] });
    qc.invalidateQueries({ queryKey: ["active-child"] });
    toast.success(
      isAddingAnother ? `${name} added to your family 🌱` : `Welcome, ${name}'s family! 🌱`,
    );
    navigate("/home", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm px-6 py-12">
      <div className="w-full max-w-md">
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
          <h1 className="mt-3 text-3xl font-bold text-foreground">
            {isAddingAnother ? "Tell us about your next little one" : "Tell us about your little one"}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {isAddingAnother
              ? "Each child gets their own private book — you can switch any time."
              : "We'll personalize every memory and milestone around them."}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
          <div className="space-y-1.5">
            <Label htmlFor="child-name">Child's name</Label>
            <Input
              id="child-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Clara"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Date of birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-11 w-full justify-start rounded-xl text-left font-normal",
                    !dob && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {dob ? format(dob, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dob}
                  onSelect={(d) => {
                    setDob(d);
                    if (d) setDobMonth(d);
                  }}
                  month={dobMonth}
                  onMonthChange={setDobMonth}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <AgePreview dob={dob} name={name} />
            <MilestoneTimelinePreview dob={dob} name={name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pronouns">Pronouns (optional)</Label>
            <Input
              id="pronouns"
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              placeholder="she/her, he/him, they/them"
              className="h-11 rounded-xl"
            />
          </div>

          <Button type="submit" variant="warm" size="lg" className="w-full" disabled={saving || !name || !dob}>
            {saving ? "Saving..." : isAddingAnother ? "Add this child" : "Start our Kidzopedia"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
