import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACTIVE_KEY = "childbook:activeChildId";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with new child's id after a successful create. */
  onCreated?: (id: string) => void;
};

export const AddChildDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [pronouns, setPronouns] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setDob(undefined);
    setPronouns("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !dob) return;
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
    // Switch active child
    localStorage.setItem(ACTIVE_KEY, data.id);
    window.dispatchEvent(new CustomEvent("childbook:active-child-changed"));
    qc.invalidateQueries({ queryKey: ["children"] });
    qc.invalidateQueries({ queryKey: ["active-child"] });
    toast.success(`${name} added to your family 🌱`);
    onCreated?.(data.id);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary-deep" /> Add another child
          </DialogTitle>
          <DialogDescription>
            Each child gets their own memories, milestones and records — you can switch any time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ac-name">Child's name</Label>
            <Input
              id="ac-name"
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
                  onSelect={setDob}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  defaultMonth={dob ?? new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ac-pronouns">Pronouns (optional)</Label>
            <Input
              id="ac-pronouns"
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              placeholder="she/her, he/him, they/them"
              className="h-11 rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="warm" disabled={saving || !name || !dob}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add child
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
