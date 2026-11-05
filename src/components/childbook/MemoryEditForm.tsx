import { format } from "date-fns";
import { CalendarIcon, Check, Loader2 } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MemoryChipField } from "./MemoryChipField";
import { MemoryPhotoManager } from "./MemoryPhotoManager";
import { CATEGORIES } from "./memoryDetailUtils";
import type { MemoryEditState } from "./useMemoryEditState";

const WhenField = ({ value, onChange }: { value: Date; onChange: (d: Date) => void }) => (
  <div className="space-y-1.5">
    <Label>When</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-11 w-full justify-start rounded-xl font-normal">
          <CalendarIcon className="h-4 w-4" />
          {format(value, "PPP")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => d && onChange(d)}
          disabled={(d) => d > new Date()}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  </div>
);

const CategoryField = ({ value, onChange }: { value: string; onChange: (c: string) => void }) => (
  <div className="space-y-1.5">
    <Label htmlFor="edit-category">Category</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id="edit-category" className="h-11 rounded-xl">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

interface Props {
  state: MemoryEditState;
  whoSuggestions: string[];
  tagSuggestions: string[];
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

/** The "Edit memory" form. */
export const MemoryEditForm = ({ state: s, whoSuggestions, tagSuggestions, saving, onCancel, onSave }: Props) => (
  <div className="space-y-4">
    <DialogTitle className="text-xl font-bold leading-tight tracking-normal text-foreground">Edit memory</DialogTitle>

    <MemoryPhotoManager
      keptUrls={s.photos.keptUrls}
      newPhotos={s.photos.newPhotos}
      highlightIdx={s.photos.highlightIdx}
      onHighlight={s.photos.setHighlightIdx}
      onRemoveKept={s.photos.removeKept}
      onRemoveNew={s.photos.removeNew}
      onAdd={s.photos.addFiles}
    />

    <div className="space-y-1.5">
      <Label htmlFor="edit-title">Title</Label>
      <Input id="edit-title" value={s.title} onChange={(e) => s.setTitle(e.target.value)} className="h-11 rounded-xl" />
    </div>

    <div className="space-y-1.5">
      <Label htmlFor="edit-story">Story</Label>
      <Textarea id="edit-story" value={s.story} onChange={(e) => s.setStory(e.target.value)} rows={5} className="rounded-xl" />
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <WhenField value={s.happenedAt} onChange={s.setHappenedAt} />
      <CategoryField value={s.category} onChange={s.setCategory} />
    </div>

    <MemoryChipField
      id="edit-who"
      label="Who was there?"
      placeholder="Mom, Grandma..."
      addLabel="Add person"
      tone="primary"
      hint={<>Separate with commas — e.g. <span className="font-medium">Mom, Dad, Grandma</span></>}
      items={s.who}
      onItemsChange={s.setWho}
      input={s.whoInput}
      onInputChange={s.setWhoInput}
      suggestions={whoSuggestions}
    />

    <MemoryChipField
      id="edit-tags"
      label="Tags"
      placeholder="firsts, summer..."
      addLabel="Add tag"
      tone="accent"
      prefix="#"
      hint={<>Separate with commas — e.g. <span className="font-medium">firsts, summer, park</span></>}
      items={s.tags}
      onItemsChange={s.setTags}
      input={s.tagInput}
      onInputChange={s.setTagInput}
      suggestions={tagSuggestions}
    />

    <div className="flex justify-end gap-2 pt-2">
      <Button variant="ghost" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      <Button variant="warm" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Save changes
      </Button>
    </div>
  </div>
);
