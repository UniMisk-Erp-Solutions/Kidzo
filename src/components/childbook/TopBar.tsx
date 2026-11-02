import { ExternalLink, HelpCircle, LifeBuoy, LogOut, Scale, Settings } from "lucide-react";
import { useEffect, useRef } from "react";
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
import { ThemeMenu } from "./ThemeMenu";
import { PrimaryNav } from "./BottomNav";

export const TopBar = ({ childName }: { childName: string }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement>(null);

  // Publish the real header height (it changes with the nav row / breakpoint) so sticky bars below can sit under it.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty("--topbar-h", `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out — see you soon!");
    navigate("/auth", { replace: true });
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3 md:max-w-[88rem] md:px-10">
        {/* The child's name is the point of the header: it gets all the spare width and
            only ellipsizes on very narrow phones, so the icons are never pushed off-screen. */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <Link to="/home" aria-label="Kidzopedia home" className="shrink-0">
            <BrandLogo className="h-8 w-8 sm:h-9 sm:w-9" />
          </Link>
          <div className="min-w-0 leading-tight">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[11px]">Kidzopedia</div>
            <ChildSwitcher childName={childName} />
          </div>
        </div>

        <PrimaryNav inline />

        <div className="flex shrink-0 items-center gap-0 sm:gap-1">
          <ThemeMenu />
          <NotificationsBell />

          {/* Help & legal — every policy is reachable from inside the app */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Help & legal"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground sm:h-10 sm:w-10"
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
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-10 sm:w-10"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <button
            aria-label="Sign out"
            onClick={handleSignOut}
            // Phones: Sign out lives in Settings, which keeps the header from overflowing.
            className="hidden h-10 w-10 items-center justify-center rounded-xl sm:flex text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>
      </div>
      <PrimaryNav />
    </header>
  );
};
