import { Bell, ImageIcon, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationsRead,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export const NotificationsBell = () => {
  const navigate = useNavigate();
  const { data = [] } = useNotifications();
  const unread = useUnreadCount();
  const markRead = useMarkNotificationsRead();

  const handleOpenChange = (open: boolean) => {
    // When closing, mark all as read so the badge clears
    if (!open && unread > 0) {
      markRead.mutate(undefined);
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-[14px] font-semibold">Notifications</div>
            <div className="text-[11px] text-muted-foreground">
              Family activity in your child's journey
            </div>
          </div>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[12px]"
              onClick={() => markRead.mutate(undefined)}
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Read
            </Button>
          )}
        </div>

        {data.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-[13px] font-medium">You're all caught up</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              We'll let you know when family adds new memories.
            </p>
          </div>
        ) : (
          <ul className="max-h-[360px] overflow-y-auto">
            {data.map((n) => {
              const title = (n.payload?.title as string) ?? "New memory";
              const photo = n.payload?.photo_url as string | undefined;
              const isUnread = !n.read_at;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => navigate("/moments")}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition hover:bg-muted/60",
                      isUnread && "bg-primary/5",
                    )}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {photo ? (
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">
                        New memory: {title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    {isUnread && (
                      <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};
