import { Home, Sparkles, TrendingUp, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";


const tabs = [
  { id: "home", label: "Home", icon: Home, path: "/home" },
  { id: "moments", label: "Moments", icon: Sparkles, path: "/moments" },
  { id: "grow", label: "Grow", icon: TrendingUp, path: "/grow" },
  { id: "books", label: "Books", icon: BookOpen, path: "/books" },
  { id: "family", label: "Family", icon: Users, path: "/family" },
] as const;

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-8px_hsl(var(--foreground)/0.08)]"
    >
      <ul className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2 md:max-w-4xl md:justify-center md:gap-2 md:py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.path === "/home" ? location.pathname === "/home" : location.pathname.startsWith(tab.path);
          return (
            <li key={tab.id} className="flex-1 md:flex-none">
              <button
                onClick={() => handleClick(tab.path)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex w-full min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 md:flex-row md:gap-2 md:px-5",
                  isActive
                    ? "text-primary-deep"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all md:h-8 md:w-8",
                    isActive && "bg-primary/30 shadow-soft",
                  )}
                >
                  <Icon className="h-[20px] w-[20px]" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className={cn("text-[11px] font-medium tracking-wide md:text-sm", isActive && "font-semibold")}>
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
