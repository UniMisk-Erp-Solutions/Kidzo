import { Lock } from "lucide-react";

/** "How your documents are protected" — static reassurance at the bottom of the page. */
export const ProtectionNote = () => (
  <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
      <Lock className="h-4 w-4" /> How your documents are protected
    </h2>
    <ul className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
      <li>• Stored in a private vault — never public, never in share links, PDFs or books.</li>
      <li>• Opened only through short-lived (60 second) secure links.</li>
      <li>• Files are saved under a random name, so the original file name is not kept.</li>
      <li>• Not accepted: Aadhaar, PAN, passport, bank or card documents. Keep those offline.</li>
    </ul>
  </section>
);
