import { Check, ChevronDown, Plus, UserCircle2, Users2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveChildId } from "@/hooks/useChildren";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export const ChildSwitcher = ({ childName }: { childName?: string }) => {
  const { user } = useAuth();
  const { activeId, setActive, children } = useActiveChildId();
  const navigate = useNavigate();

  // Always render so users can add another child even if they only have one.
  const owned = children.filter((c) => c.user_id === user?.id);
  const shared = children.filter((c) => c.user_id !== user?.id);
  const active = children.find((c) => c.id === activeId);

  return (
    <DropdownMenu>
      {/* The whole name is the trigger — not just the chevron. */}
      <DropdownMenuTrigger
        aria-label="Switch child"
        className="group -mx-1.5 flex h-8 max-w-full items-center gap-1 rounded-lg px-1.5 text-left transition-colors hover:bg-muted data-[state=open]:bg-muted"
      >
        {childName && (
          <span className="truncate text-[14px] font-semibold text-foreground">{childName}'s journey</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        <span className="sr-only">Switch child ({active?.name})</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60 rounded-xl">
        {owned.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <UserCircle2 className="h-3.5 w-3.5" /> Your children
            </DropdownMenuLabel>
            {owned.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setActive(c.id)}
                className="flex items-center justify-between rounded-lg"
              >
                <span className={cn(c.id === activeId && "font-semibold text-primary-deep")}>{c.name}</span>
                {c.id === activeId && <Check className="h-4 w-4 text-primary-deep" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
        {shared.length > 0 && (
          <>
            {owned.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Users2 className="h-3.5 w-3.5" /> Shared with you
            </DropdownMenuLabel>
            {shared.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setActive(c.id)}
                className="flex items-center justify-between rounded-lg"
              >
                <span className={cn(c.id === activeId && "font-semibold text-primary-deep")}>{c.name}</span>
                {c.id === activeId && <Check className="h-4 w-4 text-primary-deep" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/onboarding?addChild=1")}
          className="flex items-center gap-2 rounded-lg text-primary-deep focus:text-primary-deep"
        >
          <Plus className="h-4 w-4" /> Add another child
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

