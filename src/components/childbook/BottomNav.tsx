import { Home, Sparkles, TrendingUp, BookOpen, FolderLock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";


const tabs = [
  { id: "home", label: "Home", icon: Home, path: "/home", from: "--lavender", to: "--sky" },
  { id: "moments", label: "Moments", icon: Sparkles, path: "/moments", from: "--coral", to: "--peach" },
  { id: "grow", label: "Grow", icon: TrendingUp, path: "/grow", from: "--mint", to: "--sky" },
  { id: "books", label: "Books", icon: BookOpen, path: "/books", from: "--butter", to: "--peach" },
  { id: "documents", label: "Docs", icon: FolderLock, path: "/documents", from: "--sky", to: "--mint" },
  { id: "family", label: "Family", icon: Users, path: "/family", from: "--peach", to: "--butter" },
] as const;

/** Primary navigation. Rendered inside <TopBar> so it stays pinned to the top of every page. */
export const PrimaryNav = ({ inline = false }: { inline?: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav aria-label="Primary" className={inline ? "hidden lg:block" : "border-t border-border/50 lg:hidden"}>
      <ul className={cn("flex items-center gap-1", inline ? "justify-center" : "mx-auto max-w-2xl justify-around px-2 py-1.5 md:max-w-[88rem] md:px-10")}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.path === "/home" ? location.pathname === "/home" : location.pathname.startsWith(tab.path);
          return (
            <li key={tab.id} className="flex-1 md:flex-none">
              <button
                onClick={() => navigate(tab.path)}
                aria-current={isActive ? "page" : undefined}
                style={
                  isActive
                    ? { backgroundImage: `linear-gradient(135deg, hsl(var(${tab.from})), hsl(var(${tab.to})))`, color: "hsl(var(--plum))" }
                    : undefined
                }
                className={cn(
                  "group flex w-full min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all duration-300 md:min-h-[44px] md:flex-row md:gap-2 md:px-4",
                  isActive
                    ? "shadow-soft"
                    : "text-muted-foreground hover:bg-card/80 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-[20px] w-[20px] transition-transform duration-300", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[11px] tracking-wide md:text-sm", isActive ? "font-bold" : "font-medium")}>
                  {tab.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

/** Legacy mount point: the nav now lives in <TopBar>, so pages that still render this get nothing extra. */
export const BottomNav = () => null;
