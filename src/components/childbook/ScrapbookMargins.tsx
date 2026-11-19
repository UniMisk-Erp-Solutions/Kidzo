import { BookOpen, FileCheck2 } from "lucide-react";
import scrapbookObjects from "@/assets/scrapbook-margin-objects.png";

const paperAccents = { checklist: FileCheck2, openBook: BookOpen };

type Decoration = { slot: number | keyof typeof paperAccents; position: string };

const layouts: Record<"docs" | "grow" | "books" | "family", { left: Decoration[]; right: Decoration[] }> = {
  docs: {
    left: [{ slot: 0, position: "left-[20%] top-[13%] w-[86px]" }, { slot: "checklist", position: "bottom-[12%] left-[28%] w-16 -rotate-6" }],
    right: [{ slot: 1, position: "right-[17%] top-[44%] w-[101px]" }],
  },
  grow: {
    left: [{ slot: 2, position: "left-[12%] top-[34%] w-[106px]" }],
    right: [{ slot: 3, position: "right-[23%] top-[12%] w-[96px]" }],
  },
  books: {
    left: [
      { slot: 4, position: "left-[16%] top-[11%] w-[106px]" },
      { slot: 5, position: "bottom-[13%] left-[33%] w-[72px] -rotate-12 opacity-75" },
    ],
    right: [{ slot: 5, position: "right-[12%] top-[40%] w-[101px] rotate-6" }, { slot: "openBook", position: "bottom-[9%] right-[21%] w-20 -rotate-6" }],
  },
  family: {
    left: [{ slot: 6, position: "left-[18%] top-[25%] w-[101px]" }],
    right: [
      { slot: 7, position: "right-[21%] top-[13%] w-[84px] -rotate-12" },
      { slot: 6, position: "bottom-[16%] right-[11%] w-[86px] rotate-12 opacity-80" },
    ],
  },
};



function ScrapbookObject({ slot, position }: Decoration) {
  if (typeof slot === "string") {
    const Icon = paperAccents[slot];
    return (
      <span className={`absolute grid aspect-[5/4] place-items-center rounded-md border border-border bg-card text-[hsl(var(--sec-deep)/0.65)] shadow-soft ${position}`}>
        <Icon className="h-[65%] w-[65%]" strokeWidth={1.15} />
      </span>
    );
  }

  return (
    <span
      className={`scrapbook-margin-art absolute aspect-square bg-no-repeat ${position}`}
      style={{
        backgroundImage: `url(${scrapbookObjects})`,
        backgroundPosition: `${slot / 7 * 100}% center`,
        backgroundSize: "800% 100%",
      }}
    />
  );
}

export function ScrapbookMargins({ section }: { section: keyof typeof layouts }) {
  const { left, right } = layouts[section];

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 top-[var(--topbar-h,72px)] -z-10 hidden min-[1440px]:block">
      <div className="absolute inset-y-0 left-0 w-[calc((100%_-_72rem)/2)]">
        {left.map((object) => <ScrapbookObject key={object.position} {...object} />)}
      </div>
      <div className="absolute inset-y-0 right-0 w-[calc((100%_-_72rem)/2)]">
        {right.map((object) => <ScrapbookObject key={object.position} {...object} />)}
      </div>
    </div>
  );
}
