import { Settings } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChildSwitcher } from "./ChildSwitcher";
import { NotificationsBell } from "./NotificationsBell";
import { ThemeMenu } from "./ThemeMenu";
import { PrimaryNav } from "./BottomNav";
import { LEGAL, LEGAL_DOCS } from "@/pages/legal/legalConfig";
import { HelpMenu, SignOutDialog } from "./TopBarMenus";

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

          <HelpMenu contactEmail={LEGAL.contactEmail} docs={LEGAL_DOCS} />

          <button
            aria-label="Settings"
            onClick={() => navigate("/settings")}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-10 sm:w-10"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <SignOutDialog childName={childName} onConfirm={handleSignOut} />
        </div>
      </div>
      <PrimaryNav />
    </header>
  );
};
