import { TriangleAlert } from "lucide-react";
import type { ChildDocument } from "@/hooks/useDocuments";
import { LEGACY_LABEL } from "./documentCategories";
import { DocRow, type DocActions } from "./DocRow";

/** Older uploads of retired document types: still viewable and deletable, with a nudge to delete IDs. */
export const LegacyUploads = ({ docs, actions }: { docs: ChildDocument[]; actions: DocActions }) => (
  <section className="space-y-3">
    <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Older uploads</h2>
    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4">
      <p className="flex items-start gap-2 text-[13px] text-foreground/85">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        These were uploaded before we limited the vault to safer document types. We recommend deleting any government ID
        you no longer need online.
      </p>
      <ul className="mt-3 space-y-1">
        {docs.map((d) => (
          <li key={d.id}>
            <span className="px-2 text-[11px] uppercase tracking-wide text-muted-foreground">{LEGACY_LABEL[d.category] ?? d.category}</span>
            <ul>
              <DocRow doc={d} actions={actions} />
            </ul>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
