import { ExternalLink, HelpCircle, LifeBuoy, LogOut, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const labelClass = "flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground";

export interface LegalDoc {
  slug: string;
  title: string;
}

/** Help & legal — every policy is reachable from inside the app. */
export const HelpMenu = ({ contactEmail, docs }: { contactEmail: string; docs: readonly LegalDoc[] }) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      aria-label="Help & legal"
      className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground sm:h-10 sm:w-10"
    >
      <HelpCircle className="h-[18px] w-[18px]" strokeWidth={2} />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-72 rounded-xl">
      <DropdownMenuLabel className={labelClass}>
        <LifeBuoy className="h-3.5 w-3.5" /> Help &amp; support
      </DropdownMenuLabel>
      <DropdownMenuItem asChild className="rounded-lg">
        <Link to="/contact">Contact us</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="rounded-lg">
        <a href={`mailto:${contactEmail}`}>
          Email {contactEmail}
          <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
        </a>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuLabel className={labelClass}>
        <Scale className="h-3.5 w-3.5" /> Company &amp; Legal
      </DropdownMenuLabel>
      <DropdownMenuItem asChild className="rounded-lg font-medium text-primary-deep focus:text-primary-deep">
        <Link to="/legal">All legal documents</Link>
      </DropdownMenuItem>
      {docs.map((d) => (
        <DropdownMenuItem key={d.slug} asChild className="rounded-lg">
          <Link to={d.slug}>{d.title}</Link>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export const SignOutDialog = ({ childName, onConfirm }: { childName: string; onConfirm: () => void }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <button
        aria-label="Sign out"
        // Phones: Sign out lives in Settings, which keeps the header from overflowing.
        className="hidden h-10 w-10 items-center justify-center rounded-xl sm:flex text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent className="max-w-sm rounded-2xl">
      <AlertDialogHeader>
        <AlertDialogTitle>Sign out?</AlertDialogTitle>
        <AlertDialogDescription>You'll need to sign in again to see {childName}'s memories.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Stay signed in</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Sign out</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
