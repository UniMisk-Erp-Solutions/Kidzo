import { Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ChildDocument } from "@/hooks/useDocuments";
import type { DocCategoryInfo } from "./documentCategories";
import type { FolderRules } from "./useDocumentsPage";
import { DocRow, type DocActions } from "./DocRow";

const plural = (n: number) => (n === 1 ? "" : "s");

function folderSubtitle(cat: DocCategoryInfo, locked: boolean, max: number | null, count: number, lockedBy: string) {
  if (locked) return `${lockedBy} plan`;
  if (max === null) return count ? `${count} file${plural(count)} · unlimited` : cat.hint;
  return `${count} of ${max} file${plural(max)}`;
}

interface HeadingProps {
  cat: DocCategoryInfo;
  locked: boolean;
  isFolder: boolean;
  subtitle: string;
}

const FolderHeading = ({ cat, locked, isFolder, subtitle }: HeadingProps) => {
  const Icon = cat.icon;
  return (
    <div className="flex items-center gap-3">
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", locked ? "bg-muted text-muted-foreground" : cat.tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">
          {cat.label}
          {isFolder && !locked && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Folder
            </span>
          )}
        </h3>
        <p className="text-[12px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
};

interface UploadButtonProps {
  blocked: boolean;
  isFolder: boolean;
  label: string;
  onClick: () => void;
}

const UploadButton = ({ blocked, isFolder, label, onClick }: UploadButtonProps) => (
  <Button
    variant={blocked ? "outline" : "soft"}
    size="sm"
    onClick={onClick}
    aria-label={blocked ? `Upgrade to add to ${label}` : `Add to ${label}`}
  >
    {blocked ? <Lock className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
    <span className="hidden sm:inline">{blocked ? "Upgrade" : isFolder ? "Add file" : "Upload"}</span>
  </Button>
);

interface Props {
  cat: DocCategoryInfo;
  items: ChildDocument[];
  rules: FolderRules;
  canEdit: boolean;
  actions: DocActions;
  onUpload: (id: DocCategoryInfo["id"]) => void;
}

/** One document folder: heading, usage, upload button and its files. */
export const FolderCard = ({ cat, items, rules, canEdit, actions, onUpload }: Props) => {
  const locked = rules.isLocked(cat.id);
  const full = rules.isFull(cat.id);
  const max = rules.maxIn(cat.id);
  const isFolder = cat.id === "marksheet" || cat.id === "school";
  const subtitle = folderSubtitle(cat, locked, max, items.length, rules.lockedBy(cat.id));
  return (
    <li className={cn("rounded-2xl border border-border bg-card p-4 shadow-soft", locked && "bg-muted/30", isFolder && "sm:col-span-2")}>
      <div className="flex items-start justify-between gap-3">
        <FolderHeading cat={cat} locked={locked} isFolder={isFolder} subtitle={subtitle} />
        {canEdit && <UploadButton blocked={locked || full} isFolder={isFolder} label={cat.label} onClick={() => onUpload(cat.id)} />}
      </div>

      {!locked && max !== null && max > 1 && <Progress value={Math.min(100, (items.length / max) * 100)} className="mt-3 h-1.5" />}
      {full && (
        <p className="mt-2 text-[12px] font-medium text-warning-foreground">
          Folder full — upgrade{rules.planSlug === "family" ? " to Premium" : ""} to add more files.
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-3">
          {items.map((d) => (
            <DocRow key={d.id} doc={d} actions={actions} />
          ))}
        </ul>
      )}
    </li>
  );
};
