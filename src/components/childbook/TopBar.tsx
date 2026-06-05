import { BookHeart, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3 md:max-w-4xl">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/30 text-primary-deep">
            <BookHeart className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Kidzopedia</div>
            <div className="flex items-center gap-0.5">
              <div className="text-[14px] font-semibold text-foreground">{childName}'s journey</div>
              <ChildSwitcher />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationsBell />
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
