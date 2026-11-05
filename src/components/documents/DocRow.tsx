import { format } from "date-fns";
import { Download, Eye, Loader2, Trash2 } from "lucide-react";
import type { ChildDocument } from "@/hooks/useDocuments";

export type DocActions = {
  canEdit: boolean;
  /** A preview is being fetched. */
  busy: boolean;
  onView: (doc: ChildDocument) => void;
  onDownload: (doc: ChildDocument) => void;
  onDelete: (doc: ChildDocument) => void;
};

const iconButton = "rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground";

/** One stored document: title, date and the preview / download / delete buttons. */
export const DocRow = ({ doc, actions }: { doc: ChildDocument; actions: DocActions }) => (
  <li className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60">
    <div className="min-w-0 flex-1">
      <p className="truncate text-[13px] font-medium text-foreground">{doc.title}</p>
      <p className="text-[11px] text-muted-foreground">Added {format(new Date(doc.created_at), "MMM d, yyyy")}</p>
    </div>
    <div className="flex items-center gap-0.5">
      <button onClick={() => actions.onView(doc)} disabled={actions.busy} aria-label="Preview" className={`${iconButton} disabled:opacity-50`}>
        {actions.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
      </button>
      <button onClick={() => actions.onDownload(doc)} aria-label="Download" className={iconButton}>
        <Download className="h-4 w-4" />
      </button>
      {actions.canEdit && (
        <button
          onClick={() => actions.onDelete(doc)}
          aria-label="Delete"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  </li>
);
