import { BOOK_PAGE_H, BOOK_PAGE_W } from "@/components/books/pageTypes";

export const POLAROIDS_PER_PAGE = 9;

export type PolaroidItem = { id: string; title: string; photoUrl: string | null };

export const POLAROID_PAPER = "#C9A878";
const INK = "#2B1D12";
const FONT = "'Special Elite', 'Courier Prime', 'Courier New', monospace";

// A fixed set of small tilts, so every page looks hand-placed but the same export always comes out the same.
const TILTS = [-2.2, 1.6, -1.2, 2, -1.8, 1.2, -1, 2.2, -1.6];
const TAPE_TILTS = [-5, 4, -3, 6, -6, 3, -4, 5, -2];

const CARD_W = 160;
const PHOTO = 144;

/** One kraft-paper page with up to nine taped polaroids in a 3×3 grid, a typed heading and a typed footer. */
export const PolaroidGridPage = ({ title, footer, items }: { title: string; footer: string; items: PolaroidItem[] }) => (
  <div
    style={{
      position: "relative",
      width: BOOK_PAGE_W,
      height: BOOK_PAGE_H,
      overflow: "hidden",
      background: POLAROID_PAPER,
      backgroundImage:
        "repeating-linear-gradient(115deg, rgba(90,60,25,0.07) 0 2px, transparent 2px 9px), repeating-linear-gradient(25deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 13px)",
      fontFamily: FONT,
      color: INK,
    }}
  >
    <div style={{ position: "absolute", top: 30, left: 0, right: 0, textAlign: "center", fontSize: 15, letterSpacing: "0.14em" }}>
      {title}
    </div>

    <div
      style={{
        position: "absolute",
        top: 82,
        left: (BOOK_PAGE_W - (CARD_W * 3 + 20 * 2)) / 2,
        display: "grid",
        gridTemplateColumns: `repeat(3, ${CARD_W}px)`,
        columnGap: 20,
        rowGap: 30,
      }}
    >
      {items.map((item, i) => (
        <div
          key={item.id}
          style={{
            position: "relative",
            width: CARD_W,
            height: PHOTO + 8 + 30,
            padding: "8px 8px 0",
            boxSizing: "border-box",
            background: "#FFFEFA",
            boxShadow: "0 2px 6px rgba(40,25,10,0.35)",
            transform: `rotate(${TILTS[i % TILTS.length]}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -9,
              left: (CARD_W - 46) / 2,
              width: 46,
              height: 17,
              background: "#1A1A1A",
              opacity: 0.92,
              transform: `rotate(${TAPE_TILTS[i % TAPE_TILTS.length]}deg)`,
              zIndex: 2,
            }}
          />
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ display: "block", width: PHOTO, height: PHOTO, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: PHOTO,
                height: PHOTO,
                boxSizing: "border-box",
                padding: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background: "#EFE3CC",
                fontSize: 13,
                lineHeight: 1.35,
              }}
            >
              {item.title}
            </div>
          )}
        </div>
      ))}
    </div>

    <div style={{ position: "absolute", bottom: 38, left: 0, right: 0, textAlign: "center", fontSize: 13, letterSpacing: "0.14em" }}>
      {footer}
    </div>
  </div>
);
