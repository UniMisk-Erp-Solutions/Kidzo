import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Cake, ChevronRight, History, PartyPopper, PenLine, Printer, Package, Sparkles, Truck, type LucideIcon } from "lucide-react";
import { addYears, differenceInCalendarDays, differenceInDays, format, getISOWeek } from "date-fns";
import { MemoryDetail } from "@/components/childbook/MemoryDetail";
import { useUserBooks, type UserBook } from "@/hooks/useUserBooks";
import type { Memory } from "@/hooks/useMemories";
import { cn } from "@/lib/utils";

interface Props {
  dob: Date;
  childId: string;
  childName: string;
  memories: Memory[];
  canEdit: boolean;
}

interface Item {
  key: string;
  icon: LucideIcon;
  title: string;
  when: string;
  tone: string;
  imageUrl?: string | null;
  onClick?: () => void;
  /** Small uppercase line above the title. */
  label?: string;
  /** Outlined action chip shown on the right when the row is clickable. */
  cta?: string;
  /** Birthday styling: celebration gradient, confetti and a countdown badge. */
  festive?: { days: number };
}

/** One question a week; the week number picks it, so it changes every Monday and repeats after half a year. */
const WEEKLY_PROMPTS = [
  "What made {name} laugh this week?",
  "Something new {name} tried recently",
  "A word or phrase {name} keeps saying",
  "What is {name} into right now?",
  "A small thing {name} did that made you proud",
  "Who did {name} spend time with this week?",
  "{name}'s favourite meal lately",
  "A moment of kindness you saw from {name}",
  "Something {name} is learning at the moment",
  "A funny question {name} asked",
  "Where did {name} go this week?",
  "A song, show, or game {name} loves right now",
  "A quiet moment with {name} worth keeping",
  "Something {name} is really good at",
  "A challenge {name} worked through",
  "What does {name} say they want to be when they grow up?",
  "A tradition {name} enjoyed lately",
  "Something {name} made or drew",
  "A new habit {name} has picked up",
  "A day you'd love to relive with {name}",
  "{name}'s current favourite place to hang out",
  "Something {name} taught you",
  "{name} with a grandparent or relative",
  "A fear {name} got past",
  "What made {name} proud this week?",
  "A photo {name} took or chose",
];

const PRINT_READY_MEMORIES = 24;

export const UpcomingMilestones = ({ dob, childId, childName, memories, canEdit }: Props) => {
  const navigate = useNavigate();
  const { data: books = [] } = useUserBooks();
  const [open, setOpen] = useState<Memory | null>(null);

  const items = useMemo(() => {
    const today = new Date();
    const list: Item[] = [birthdayItem(dob, childName, today)];

    const book = bookItem(books.filter((b) => b.child_id === childId), memories.length, navigate);
    if (book) list.push(book);

    const flash = onThisDay(memories, today);
    if (flash) {
      const { memory, yearsAgo, exact } = flash;
      list.push({
        key: "on-this-day",
        label: "On this day",
        cta: "Relive",
        icon: History,
        title: memory.title,
        when: `${yearsAgo} ${yearsAgo === 1 ? "year" : "years"} ago ${exact ? "today" : "this week"} · ${format(new Date(memory.happened_at), "MMM d, yyyy")}`,
        tone: "bg-accent/40 text-accent-foreground",
        imageUrl: memory.photo_url,
        onClick: () => setOpen(memory),
      });
    }

    const prompt = WEEKLY_PROMPTS[getISOWeek(today) % WEEKLY_PROMPTS.length].replace("{name}", childName);
    list.push({
      key: "weekly-prompt",
      label: "Weekly prompt",
      cta: canEdit ? "Write" : undefined,
      icon: PenLine,
      title: prompt,
      when: canEdit ? "Tap to capture it" : "A little moment worth keeping",
      tone: "bg-primary/30 text-primary-deep",
      onClick: canEdit ? () => navigate("/moments/new") : undefined,
    });
    return list;
  }, [dob, childId, childName, memories, books, canEdit, navigate]);

  return (
    <section aria-label="Upcoming milestones" className="animate-fade-in-up">
      <h2 className="mb-3 text-xl font-semibold text-foreground sm:text-2xl">Coming up</h2>
      <ul className="space-y-4">
        {items.map((m) => (
          <li key={m.key}>
            <ItemRow item={m} />
          </li>
        ))}
      </ul>
      <MemoryDetail memory={open} onClose={() => setOpen(null)} />
    </section>
  );
};

const FestiveRow = ({ item, days }: { item: Item; days: number }) => (
  <div className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-gradient-celebrate p-4 shadow-soft sm:p-5">
    <Sparkles className="pointer-events-none absolute right-3 top-2 h-4 w-4 text-accent-foreground/40" />
    <PartyPopper className="pointer-events-none absolute -bottom-1 right-14 h-9 w-9 -rotate-12 text-primary-deep/15" />
    <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-card/85 text-primary-deep shadow-soft">
      <Cake className="h-6 w-6" strokeWidth={2.2} />
      <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-accent-foreground" />
    </span>
    <div className="relative min-w-0 flex-1">
      <div className="line-clamp-2 text-[15px] font-semibold text-[hsl(var(--on-celebrate))]">{item.title} 🎉</div>
      <div className="text-[13px] text-[hsl(var(--on-celebrate))]/70">{days === 0 ? "It’s today!" : "Time to start planning the memories"}</div>
    </div>
    <span className="relative flex-shrink-0 rounded-2xl bg-card/85 px-3 py-1.5 text-center shadow-soft">
      <span className="block text-lg font-bold leading-none text-primary-deep">{days === 0 ? "🎂" : days}</span>
      <span className="block pt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {days === 0 ? "today" : days === 1 ? "day" : "days"}
      </span>
    </span>
  </div>
);

const ItemRow = ({ item }: { item: Item }) => {
  if (item.festive) return <FestiveRow item={item} days={item.festive.days} />;
  const Icon = item.icon;
  const body = (
    <>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" loading="lazy" className="h-11 w-11 flex-shrink-0 rounded-xl object-cover" />
      ) : (
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {item.label && (
          <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-deep/70">{item.label}</div>
        )}
        <div className="line-clamp-2 text-[15px] font-semibold text-foreground">{item.title}</div>
        <div className="text-[13px] text-muted-foreground">{item.when}</div>
      </div>
      {item.onClick && item.cta && (
        <span className="relative inline-flex flex-shrink-0 items-center gap-0.5 rounded-full border border-primary-deep/30 px-2.5 py-1 text-[12px] font-medium text-primary-deep transition-colors group-hover:border-primary-deep/60 group-hover:bg-primary/10">
          {item.cta}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      )}
      <Icon className="pointer-events-none absolute -bottom-3 right-10 h-16 w-16 -rotate-12 text-foreground/[0.04]" strokeWidth={1.6} />
    </>
  );
  const cls = "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition-all duration-200 sm:p-5";
  return item.onClick ? (
    <button type="button" onClick={item.onClick} className={cn(cls, "hover:-translate-y-0.5 hover:shadow-lift")}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
};

const birthdayItem = (dob: Date, childName: string, today: Date): Item => {
  let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (next < today) next = addYears(next, 1);
  const days = differenceInDays(next, today);
  return {
    key: "birthday",
    icon: Cake,
    title: `${childName}'s ${ordinal(next.getFullYear() - dob.getFullYear())} birthday`,
    when: `in ${days} ${days === 1 ? "day" : "days"}`,
    tone: "bg-secondary/25 text-secondary",
    festive: { days },
  };
};

/** The most pressing thing about the child's books: an order on its way beats one being printed, beats an unfinished book. */
const bookItem = (books: UserBook[], memoryCount: number, navigate: (to: string) => void): Item | null => {
  const latest = (statuses: UserBook["status"][]) => books.find((b) => statuses.includes(b.status)); // books arrive newest first
  const go = (b: UserBook, path: string) => () => navigate(`/books/${b.id}/${path}`);

  const shipped = latest(["shipped"]);
  if (shipped) {
    return {
      key: "book-shipped",
      label: "Your book",
      cta: "Track",
      icon: Truck,
      title: `"${shipped.title}" is on its way`,
      when: shipped.tracking_number ? `Tracking: ${shipped.tracking_number}` : "Shipped",
      tone: "bg-secondary/25 text-secondary",
      onClick: go(shipped, "confirmation"),
    };
  }
  const printing = latest(["printing"]);
  if (printing) {
    return {
      key: "book-printing",
      label: "Your book",
      cta: "View",
      icon: Printer,
      title: `"${printing.title}" is being printed`,
      when: "We'll let you know when it ships",
      tone: "bg-accent/40 text-accent-foreground",
      onClick: go(printing, "confirmation"),
    };
  }
  const ordered = latest(["ordered"]);
  if (ordered) {
    return {
      key: "book-ordered",
      label: "Your book",
      cta: "View",
      icon: Package,
      title: `"${ordered.title}" order confirmed`,
      when: ordered.order_date ? `Ordered ${format(new Date(ordered.order_date), "MMM d")}` : "Waiting to be printed",
      tone: "bg-accent/40 text-accent-foreground",
      onClick: go(ordered, "confirmation"),
    };
  }
  const unfinished = latest(["preview", "draft"]);
  if (unfinished) {
    return {
      key: "book-unfinished",
      label: "Your book",
      cta: unfinished.status === "preview" ? "Order" : "Continue",
      icon: BookOpen,
      title: `Finish "${unfinished.title}"`,
      when: unfinished.status === "preview" ? "In preview · ready to order" : "Draft · pick up where you left off",
      tone: "bg-primary/30 text-primary-deep",
      onClick: go(unfinished, unfinished.status === "preview" ? "preview" : "memories"),
    };
  }
  if (books.length === 0 && memoryCount >= PRINT_READY_MEMORIES) {
    return {
      key: "book-ready",
      label: "Your book",
      cta: "Create",
      icon: BookOpen,
      title: `You have ${memoryCount} memories, enough for a book`,
      when: "Turn them into a printed keepsake",
      tone: "bg-primary/30 text-primary-deep",
      onClick: () => navigate("/books/new"),
    };
  }
  return null;
};

/** A memory from a past year on today's date, or failing that within three days of it. */
const onThisDay = (memories: Memory[], today: Date) => {
  let best: { memory: Memory; yearsAgo: number; gap: number } | null = null;
  for (const memory of memories) {
    const d = new Date(memory.happened_at);
    const yearsAgo = today.getFullYear() - d.getFullYear();
    if (yearsAgo < 1) continue;
    const gap = Math.abs(differenceInCalendarDays(new Date(today.getFullYear(), d.getMonth(), d.getDate()), today));
    if (gap > 3) continue;
    if (!best || gap < best.gap || (gap === best.gap && yearsAgo > best.yearsAgo)) best = { memory, yearsAgo, gap };
  }
  return best && { memory: best.memory, yearsAgo: best.yearsAgo, exact: best.gap === 0 };
};

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
