import { useState } from "react";
import { LegalAcknowledgement, LegalLink } from "@/components/AcceptTerms";
import { LEGAL } from "@/lib/legalConfig";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
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
import { PronounsSelect } from "@/components/childbook/PronounsSelect";
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

const DobPicker = ({ dob, onSelect }: { dob: Date | undefined; onSelect: (d: Date | undefined) => void }) => (
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
          disabled={(d) => d > new Date()}
          initialFocus
          defaultMonth={dob ?? new Date()}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  </div>
);

const GuardianConsent = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <div className="rounded-xl border border-border bg-muted/30 p-3">
    <LegalAcknowledgement id="authorize-add-child" checked={checked} onChange={onChange}>
      If this person is under 18, I am their parent or lawful guardian. If they are 18 or older, I have their permission. I authorize Kidzopedia to use the profile details and the content I choose to add to provide the family keepsake, as described in the <LegalLink to="/legal/privacy#children">Privacy Policy</LegalLink>.
    </LegalAcknowledgement>
  </div>
);

/** Makes the newly added child the active one and refreshes the lists that show children. */
const activateChild = (qc: QueryClient, id: string) => {
  localStorage.setItem(ACTIVE_KEY, id);
  window.dispatchEvent(new CustomEvent("childbook:active-child-changed"));
  qc.invalidateQueries({ queryKey: ["children"] });
  qc.invalidateQueries({ queryKey: ["active-child"] });
};

export const AddChildDialog =({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [pronouns, setPronouns] = useState("");
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const reset = () => {
    setName("");
    setDob(undefined);
    setPronouns("");
    setAuthorized(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !dob || !authorized || saving) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("child_profiles")
      .insert({
        user_id: user.id,
        name,
        dob: format(dob, "yyyy-MM-dd"),
        pronouns: pronouns || null,
        guardian_notice_version: LEGAL.guardianNoticeVersion,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error(error?.message ?? "Couldn't add child");
      return;
    }
    activateChild(qc, data.id);
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-md">
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

          <DobPicker dob={dob} onSelect={setDob} />

          <div className="space-y-1.5">
            <Label htmlFor="ac-pronouns">Pronouns (optional)</Label>
            <PronounsSelect id="ac-pronouns" value={pronouns} onChange={setPronouns} />
          </div>

          <GuardianConsent checked={authorized} onChange={setAuthorized} />

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="warm" disabled={saving || !name || !dob || !authorized}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add child
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
