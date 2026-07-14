import { ExternalLink, HelpCircle, LifeBuoy, LogOut, Scale, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LEGAL, LEGAL_DOCS } from "@/pages/legal/legalConfig";
import { ChildSwitcher } from "./ChildSwitcher";
import { NotificationsBell } from "./NotificationsBell";

export const TopBar = ({ childName }: { childName: string }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out — see you soon!");
    navigate("/auth", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-6 py-3 md:max-w-4xl">
        {/* Never squeeze the child's name — it is the point of the header. */}
        <div className="flex shrink-0 items-center gap-2.5">
          <Link to="/home" aria-label="Kidzopedia home">
            <BrandLogo className="h-9 w-9" />
          </Link>
          <div className="leading-tight">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Kidzopedia</div>
            <ChildSwitcher childName={childName} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationsBell />

          {/* Help & legal — every policy is reachable from inside the app */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Help & legal"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
            >
              <HelpCircle className="h-[18px] w-[18px]" strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-xl">
              <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <LifeBuoy className="h-3.5 w-3.5" /> Help &amp; support
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="rounded-lg">
                <Link to="/contact">Contact us</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg">
                <a href={`mailto:${LEGAL.contactEmail}`}>
                  Email {LEGAL.contactEmail}
                  <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Scale className="h-3.5 w-3.5" /> Company &amp; Legal
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="rounded-lg font-medium text-primary-deep focus:text-primary-deep">
                <Link to="/legal">All legal documents</Link>
              </DropdownMenuItem>
              {LEGAL_DOCS.map((d) => (
                <DropdownMenuItem key={d.slug} asChild className="rounded-lg">
                  <Link to={d.slug}>{d.title}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            aria-label="Settings"
            onClick={() => navigate("/settings")}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <button
            aria-label="Sign out"
            onClick={handleSignOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
};
