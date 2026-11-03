import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Cake, History, PenLine, Printer, Package, Truck, type LucideIcon } from "lucide-react";
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
      icon: PenLine,
      title: prompt,
      when: canEdit ? "This week's prompt · tap to capture it" : "This week's prompt",
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

const ItemRow = ({ item }: { item: Item }) => {
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
        <div className="line-clamp-2 text-[15px] font-semibold text-foreground">{item.title}</div>
        <div className="text-[13px] text-muted-foreground">{item.when}</div>
      </div>
    </>
  );
  const cls = "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition-all duration-200 sm:p-5";
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
