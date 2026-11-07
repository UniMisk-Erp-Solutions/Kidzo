import { useEffect, useState, type ReactNode } from "react";
import { EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Discourages screenshots and copying of book previews.
 *
 * IMPORTANT — what this can and cannot do: a web page can never truly block a screenshot
 * (phone screenshot gestures, OS tools and cameras are invisible to the browser). This is a
 * deterrent: it hides the content when the tab loses focus or a capture/print shortcut is pressed,
 * blocks right-click / drag / print, and overlays a faint watermark carrying the viewer's email
 * so a leaked image can be traced.
 */
/** Hides the content while a capture/print shortcut is held, the tab loses focus or the page is being printed. */
function useShieldHidden(extended: boolean) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const hideFor = (ms: number) => {
      setHidden(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setHidden(false), ms);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "PrintScreen") return;
      try { void navigator.clipboard?.writeText(""); } catch { /* clipboard may be blocked */ }
      hideFor(2500);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // extended (Export & Share only): hide as soon as the Windows/Cmd key goes down, before a snipping tool starts
      if (extended && (k === "meta" || k === "os" || e.metaKey)) hideFor(4000);
      const mod = e.ctrlKey || e.metaKey;
      // print / save / Win+Shift+S / Mac Cmd+Shift+3|4|5
      const printOrSave = mod && (k === "p" || k === "s");
      const snip = e.shiftKey && (e.metaKey || e.getModifierState?.("OS")) && (k === "s" || ["3", "4", "5"].includes(k));
      if (printOrSave || snip) {
        e.preventDefault();
        hideFor(2500);
      }
    };
    const hide = () => setHidden(true);
    const show = () => setHidden(false);
    const onVisibility = () => setHidden(document.visibilityState !== "visible");

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeprint", hide);
    window.addEventListener("afterprint", show);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeprint", hide);
      window.removeEventListener("afterprint", show);
    };
  }, [extended]);

  return hidden;
}

/** Faint repeating watermark carrying the viewer's email. `extended` tiles it over the full height of long content. */
const ShieldWatermark = ({ mark, extended }: { mark: string; extended: boolean }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    {extended ? (
      // tiled SVG so the mark covers the full height of every page, however many
      <div
        className="absolute inset-0 text-foreground opacity-[0.10]"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='140'><text x='130' y='70' text-anchor='middle' transform='rotate(-24 130 70)' font-family='sans-serif' font-size='13' font-weight='600' fill='currentColor'>${mark.replace(/[<>&'"]/g, "")}</text></svg>`,
          ).replace(/currentColor/g, "%23000")}")`,
        }}
      />
    ) : (
      <div className="absolute -inset-1/2 flex rotate-[-24deg] flex-wrap content-start gap-x-10 gap-y-12 opacity-[0.10]">
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className="whitespace-nowrap text-[13px] font-semibold text-foreground">
            {mark}
          </span>
        ))}
      </div>
    )}
  </div>
);

const HiddenCover = ({ extended }: { extended: boolean }) => (
  <div className={`${extended ? "fixed z-[100]" : "absolute z-20"} inset-0 flex flex-col items-center justify-center gap-2 bg-background text-center`}>
    <EyeOff className="h-6 w-6 text-muted-foreground" />
    <p className="max-w-[16rem] text-[13px] text-muted-foreground">
      Preview hidden. Book pages can't be captured — upgrade and order a printed copy to keep your book.
    </p>
  </div>
);

export const ScreenshotShield = ({ children, extended = false }: { children: ReactNode; extended?: boolean }) => {
  const { user } = useAuth();
  const hidden = useShieldHidden(extended);
  const mark = (user?.email ?? "Kidzopedia preview").slice(0, 40);

  return (
    <div
      className={`screenshot-shield relative w-full select-none [-webkit-touch-callout:none] ${extended ? "min-h-full" : "h-full"}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
      <ShieldWatermark mark={mark} extended={extended} />
      {hidden && <HiddenCover extended={extended} />}
    </div>
  );
};
