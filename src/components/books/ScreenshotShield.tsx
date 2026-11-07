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
export const ScreenshotShield = ({ children, extended = false }: { children: ReactNode; extended?: boolean }) => {
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const hideFor = (ms: number) => {
      setHidden(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setHidden(false), ms);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        try { void navigator.clipboard?.writeText(""); } catch { /* clipboard may be blocked */ }
        hideFor(2500);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // extended (Export & Share only): hide as soon as the Windows/Cmd key goes down, before a snipping tool starts
      if (extended && (k === "meta" || k === "os" || e.metaKey)) hideFor(4000);
      const mod = e.ctrlKey || e.metaKey;
      // print / save / Win+Shift+S / Mac Cmd+Shift+3|4|5
      if ((mod && (k === "p" || k === "s")) || (e.shiftKey && (e.metaKey || e.getModifierState?.("OS")) && (k === "s" || ["3", "4", "5"].includes(k)))) {
        e.preventDefault();
        hideFor(2500);
      }
    };
    const onBlur = () => setHidden(true);
    const onFocus = () => setHidden(false);
    const onVisibility = () => setHidden(document.visibilityState !== "visible");
    const onBeforePrint = () => setHidden(true);
    const onAfterPrint = () => setHidden(false);

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [extended]);

  const mark = (user?.email ?? "Kidzopedia preview").slice(0, 40);

  return (
    <div
      className={`screenshot-shield relative w-full select-none [-webkit-touch-callout:none] ${extended ? "min-h-full" : "h-full"}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}

      {/* faint repeating watermark carrying the viewer's email */}
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

      {hidden && (
        <div className={`${extended ? "fixed z-[100]" : "absolute z-20"} inset-0 flex flex-col items-center justify-center gap-2 bg-background text-center`}>
          <EyeOff className="h-6 w-6 text-muted-foreground" />
          <p className="max-w-[16rem] text-[13px] text-muted-foreground">
            Preview hidden. Book pages can't be captured — upgrade and order a printed copy to keep your book.
          </p>
        </div>
      )}
    </div>
  );
};
